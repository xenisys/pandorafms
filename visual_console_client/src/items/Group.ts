import { LinkedVisualConsoleProps, AnyObject } from "../lib/types";
import {
  linkedVCPropsDecoder,
  parseIntOr,
  notEmptyStringOr,
  stringIsEmpty,
  decodeBase64,
  parseBoolean,
  t
} from "../lib";
import Item, {
  ItemProps,
  itemBasePropsDecoder,
  ItemType,
  LinkConsoleInputGroup,
  ImageInputGroup
} from "../Item";
import { FormContainer, InputGroup } from "../Form";

export type GroupProps = {
  type: ItemType.GROUP_ITEM;
  groupId: number;
  imageSrc: string | null; // URL?
  statusImageSrc: string | null;
  showStatistics: boolean;
  html?: string | null;
} & ItemProps &
  LinkedVisualConsoleProps;

function extractHtml(data: AnyObject): string | null {
  if (!stringIsEmpty(data.html)) return data.html;
  if (!stringIsEmpty(data.encodedHtml)) return decodeBase64(data.encodedHtml);
  return null;
}

/**
 * Build a valid typed object from a raw object.
 * This will allow us to ensure the type safety.
 *
 * @param data Raw object.
 * @return An object representing the group props.
 * @throws Will throw a TypeError if some property
 * is missing from the raw object or have an invalid type.
 */
export function groupPropsDecoder(data: AnyObject): GroupProps | never {
  if (
    (typeof data.imageSrc !== "string" || data.imageSrc.length === 0) &&
    data.encodedHtml === null
  ) {
    throw new TypeError("invalid image src.");
  }
  if (parseIntOr(data.groupId, null) === null) {
    throw new TypeError("invalid group Id.");
  }

  const showStatistics = parseBoolean(data.showStatistics);
  const html = showStatistics ? extractHtml(data) : null;

  return {
    ...itemBasePropsDecoder(data), // Object spread. It will merge the properties of the two objects.
    type: ItemType.GROUP_ITEM,
    groupId: parseInt(data.groupId),
    imageSrc: notEmptyStringOr(data.imageSrc, null),
    statusImageSrc: notEmptyStringOr(data.statusImageSrc, null),
    showStatistics,
    html,
    ...linkedVCPropsDecoder(data) // Object spread. It will merge the properties of the two objects.
  };
}

// TODO: Document
class ShowStatisticsInputGroup extends InputGroup<Partial<GroupProps>> {
  protected createContent(): HTMLElement | HTMLElement[] {
    const showStatisticsLabel = document.createElement("label");
    showStatisticsLabel.textContent = t("Show statistics");

    const showStatisticsInputChkbx = document.createElement("input");
    showStatisticsInputChkbx.id = "checkbox-switch";
    showStatisticsInputChkbx.className = "checkbox-switch";
    showStatisticsInputChkbx.type = "checkbox";
    showStatisticsInputChkbx.name = "checkbox-enable-link";
    showStatisticsInputChkbx.value = "1";
    showStatisticsInputChkbx.checked =
      this.currentData.showStatistics ||
      this.initialData.showStatistics ||
      false;
    showStatisticsInputChkbx.addEventListener("change", e =>
      this.updateData({
        showStatistics: (e.target as HTMLInputElement).checked
      })
    );

    const linkInputLabel = document.createElement("label");
    linkInputLabel.className = "label-switch";
    linkInputLabel.htmlFor = "checkbox-switch";

    showStatisticsLabel.appendChild(showStatisticsInputChkbx);
    showStatisticsLabel.appendChild(linkInputLabel);

    return showStatisticsLabel;
  }
}

export default class Group extends Item<GroupProps> {
  protected createDomElement(): HTMLElement {
    const element = document.createElement("div");
    element.className = "group";

    if (!this.props.showStatistics && this.props.statusImageSrc !== null) {
      // Icon with status.
      element.style.backgroundImage = `url(${this.props.statusImageSrc})`;
      element.style.backgroundRepeat = "no-repeat";
      element.style.backgroundSize = "contain";
      element.style.backgroundPosition = "center";
    } else if (this.props.showStatistics && this.props.html != null) {
      // Stats table.
      element.innerHTML = this.props.html;
    }

    return element;
  }

  /**
   * To update the content element.
   * @override Item.updateDomElement
   */
  protected updateDomElement(element: HTMLElement): void {
    if (!this.props.showStatistics && this.props.statusImageSrc !== null) {
      // Icon with status.
      element.style.backgroundImage = `url(${this.props.statusImageSrc})`;
      element.style.backgroundRepeat = "no-repeat";
      element.style.backgroundSize = "contain";
      element.style.backgroundPosition = "center";
      element.innerHTML = "";
    } else if (this.props.showStatistics && this.props.html != null) {
      // Stats table.
      element.innerHTML = this.props.html;
    }
  }

  /**
   * @override function to add or remove inputsGroups those that are not necessary.
   * Add to:
   * LinkConsoleInputGroup
   * ImageInputGroup
   * ShowStatisticsInputGroup
   */
  public getFormContainer(): FormContainer {
    const formContainer = super.getFormContainer();
    formContainer.addInputGroup(
      new LinkConsoleInputGroup("link-console", this.props)
    );
    formContainer.addInputGroup(
      new ImageInputGroup("image-console", {
        ...this.props,
        imageKey: "imageSrc",
        showStatusImg: true
      })
    );
    formContainer.addInputGroup(
      new ShowStatisticsInputGroup("show-statistic", this.props)
    );
    return formContainer;
  }
}
