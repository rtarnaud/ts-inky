import type { Cheerio, CheerioOptions, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

import assert from "node:assert";
import { format } from "node:util";

import * as cheerio from "cheerio";
import { Document, Text, CDATA, Comment } from "domhandler";

export type ComponentTags = {
  button: "button";
  row: "row";
  columns: "columns";
  container: "container";
  callout: "callout";
  inky: "inky";
  blockGrid: "block-grid";
  menu: "menu";
  menuItem: "item";
  center: "center";
  spacer: "spacer";
  wrapper: "wrapper";
  hLine: "h-line";
};

export type InkyOptions = {
  columnCount: number;
  cheerio: object;
  components: Partial<ComponentTags>;
};

const ignoredAttributes = [
  "class",
  "id",
  "href",
  "size",
  "size-sm",
  "size-lg",
  "large",
  "no-expander",
  "small",
  "target",
];

// Grabs all attributes from an element and returns them as a string
// to be put back into outputted table elements
function getAttrs<Element extends AnyNode>(
  el: Cheerio<Element> | string,
  $: CheerioAPI,
): string {
  let result = "";

  const attrs = $(el).attr();
  if (!attrs) return result;

  for (const [key, value] of Object.entries(attrs)) {
    if (!ignoredAttributes.includes(key)) {
      result += " " + key + "=" + '"' + value + '"';
    }
  }

  return result;
}

export default class Inky {
  private _columnCount: number;
  private _cheerioOptions: CheerioOptions;
  private _components: Record<string, string>;

  constructor(options: Partial<InkyOptions> = {}) {
    // Default to 12 columns
    // Column count for grid
    this._columnCount = options.columnCount || 12;

    // Cheerio options
    this._cheerioOptions = Object.assign({}, options.cheerio || {});

    // this._cheerioOptions.xml = { decodeEntities: false };

    // HTML tags for custom components
    this._components = Object.assign(
      {
        button: "button",
        row: "row",
        columns: "columns",
        container: "container",
        callout: "callout",
        inky: "inky",
        blockGrid: "block-grid",
        menu: "menu",
        menuItem: "item",
        center: "center",
        spacer: "spacer",
        wrapper: "wrapper",
        hLine: "h-line",
      },
      options.components || {},
    );
  }

  /**
   * Awww yiss. Kickstarts the whole parser.
   * Takes in HTML as a string, checks if there are any custom components.
   * If there are, it replaces the nested components, traverses the DOM and replaces them with email markup.
   */
  public releaseTheKraken(xmlString: string): string {
    // This large compound selector looks for any custom tag loaded into Inky
    // <center> is an exception: the selector is center:not([data-parsed])
    // Otherwise the parser gets caught in an infinite loop where it continually tries to process the same <center> tags
    let [text, raws] = this._extractRaws(xmlString);

    // Normalize void elements to self-closing BEFORE cheerio parses them
    // This prevents cheerio from treating them as container elements
    text = this._normalizeVoidElements(text);

    const $ = cheerio.load(text, this._cheerioOptions);
    const tags = Object.values(this._components)
      .map((tag) => {
        if (tag == "center") {
          return tag + ":not([data-parsed])";
        }

        return tag;
      })
      .join(", ");

    // Because the structure of the DOM constantly shifts, we carefully go through each custom tag one at a time, until there are no more custom tags to parse
    while ($(tags).length > 0) {
      const elem = $(tags).eq(0);
      const newHtml = this._componentFactory(elem, $);
      elem.replaceWith(newHtml);
    }

    // Remove data-parsed attributes created for <center>
    $("[data-parsed]").removeAttr("data-parsed");

    text = $.html();

    // Convert self-closing tags to properly closed tags for non-void elements
    // This is needed because cheerio in XML mode outputs self-closing tags
    text = this._convertSelfClosingTags(text);

    return this._reInjectRaws(text, raws);
  }

  /**
   * Normalizes void elements to self-closing format BEFORE cheerio parses them.
   * This prevents cheerio from treating void elements like <img> as container elements
   * that can wrap other content.
   */
  private _normalizeVoidElements(html: string): string {
    // Convert non-self-closing void elements to self-closing format
    // Match: <tagname [attributes]> but not <tagname [attributes] /> or <tagname/>
    return html.replace(
      /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^>]*?)>(?!\s*<\/\1)/gi,
      (match, tagName, attrs) => {
        // Check if it already ends with / (meaning it's already self-closing like <img ... />)
        if (attrs && attrs.trim().endsWith("/")) {
          return match; // Already self-closing
        }
        return `<${tagName}${attrs || ""} />`;
      },
    );
  }

  /**
   * Converts self-closing tags to properly closed tags for non-void HTML elements.
   * For example: <td/> becomes <td></td>, <th/> becomes <th></th>
   * Void elements like <br/>, <hr/>, <img/>, etc. are converted to self-closing format.
   * Also converts improperly paired void elements like <img></img> or <img> to <img />.
   */
  private _convertSelfClosingTags(html: string): string {
    // HTML void elements that should remain self-closing
    const voidElements = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ];

    // First, convert improperly closed void elements like <img ...></img> to self-closing <img ... />
    // This handles cases where cheerio outputs paired tags for void elements
    // Match: <tagname [attributes]></tagname> with optional whitespace between tags
    html = html.replace(
      /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^>]*)?\s*>\s*<\/\1\s*>/gi,
      (match, tagName, attrs) => {
        return `<${tagName}${attrs || ""} />`;
      },
    );

    // Convert non-self-closing void elements to self-closing format
    // Match: <tagname [attributes]> that doesn't end with />
    // We need to match <img attrs> but not <img attrs/> or <img attrs />
    html = html.replace(
      /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^>]*?)>(?!\s*<\/\1)/gi,
      (match, tagName, attrs) => {
        // Check if it already ends with /
        if (attrs && attrs.trim().endsWith("/")) {
          return match; // Already self-closing
        }
        return `<${tagName}${attrs || ""} />`;
      },
    );

    // Match self-closing tags like <tagname ... /> or <tagname/>
    // Capture the tag name and any attributes
    return html.replace(
      /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^>]*)?)\s*\/>/g,
      (match, tagName, attrs) => {
        const lowerTagName = tagName.toLowerCase();
        if (voidElements.includes(lowerTagName)) {
          // Keep void elements as self-closing
          return match;
        }
        // Convert to properly closed tag
        return `<${tagName}${attrs || ""}></${tagName}>`;
      },
    );
  }

  private _extractRaws(text: string): [string, string[]] {
    const raws = [];
    let i = 0;
    let raw;
    let str = text;

    const regex = /\< *raw *\>(.*?)\<\/ *raw *\>/i;
    while ((raw = str.match(regex))) {
      raws[i] = raw[1];
      str = str.replace(regex, "###RAW" + i + "###");
      ++i;
    }

    return [str, raws];
  }

  private _reInjectRaws(text: string, raws: string[]): string {
    let str = text;
    for (let i = 0; i < raws.length; ++i) {
      str = str.replace("###RAW" + i + "###", raws[i]);
    }
    return str;
  }

  private _componentFactory<Element extends AnyNode>(
    element: Cheerio<Element>,
    $: CheerioAPI,
  ): string {
    let inner = element.html();
    const attrs = getAttrs(element, $);

    assert.ok(
      !(element[0] instanceof Document),
      "Element must not be a Document",
    );
    assert.ok(
      !(element[0] instanceof CDATA),
      "Element must not be a CDATA node",
    );
    assert.ok(!(element[0] instanceof Text), "Element must not be a Text node");
    assert.ok(
      !(element[0] instanceof Comment),
      "Element must not be a Comment node",
    );

    const node = element[0];
    if (!("name" in node)) {
      throw new Error("Element must have a name property");
    }

    switch (node.name) {
      // <hr>
      case this._components.hLine: {
        let classes = ["h-line"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }
        return format(
          '<table class="%s"><tr><th>&nbsp;</th></tr></table>',
          classes.join(" "),
        );
      }

      // <column>
      case this._components.columns:
        return this._makeColumn(element, $);

      // <row>
      case this._components.row: {
        let classes = ["row"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }

        return format(
          '<table %s class="%s"><tbody><tr>%s</tr></tbody></table>',
          attrs,
          classes.join(" "),
          inner,
        );
      }

      // <button>
      case this._components.button: {
        let expander = "";

        // Prepare optional target attribute for the <a> element
        let target = "";
        if (element.attr("target")) {
          target = " target=" + element.attr("target")!;
        }

        // If we have the href attribute we can create an anchor for the inner of the button;
        if (element.attr("href")) {
          inner = format(
            '<a %s href="%s"%s>%s</a>',
            attrs,
            element.attr("href")!,
            target,
            inner,
          );
        }

        // If the button is expanded, it needs a <center> tag around the content
        if (element.hasClass("expand") || element.hasClass("expanded")) {
          inner = format("<center>%s</center>", inner);
          expander = '\n<td class="expander"></td>';
        }

        // The .button class is always there, along with any others on the <button> element
        let classes = ["button"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }

        return format(
          '<table class="%s"><tbody><tr><td><table><tbody><tr><td>%s</td></tr></tbody></table></td>%s</tr></tbody></table>',
          classes.join(" "),
          inner,
          expander,
        );
      }

      // <container>
      case this._components.container: {
        let classes = ["container"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }

        return format(
          '<table %s align="center" class="%s"><tbody><tr><td>%s</td></tr></tbody></table>',
          attrs,
          classes.join(" "),
          inner,
        );
      }

      // <inky>
      case this._components.inky:
        return '<tr><td><img src="https://raw.githubusercontent.com/arvida/emoji-cheat-sheet.com/master/public/graphics/emojis/octopus.png" /></tr></td>';

      // <block-grid>
      case this._components.blockGrid: {
        let classes = ["block-grid", "up-" + element.attr("up")];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }
        return format(
          '<table class="%s"><tbody><tr>%s</tr></tbody></table>',
          classes.join(" "),
          inner,
        );
      }

      // <menu>
      case this._components.menu: {
        let classes = ["menu"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }
        return format(
          '<table %s class="%s"><tbody><tr><td><table><tbody><tr>%s</tr></tbody></table></td></tr></tbody></table>',
          attrs,
          classes.join(" "),
          inner,
        );
      }

      // <item>
      case this._components.menuItem: {
        // Prepare optional target attribute for the <a> element
        let target = "";
        if (element.attr("target")) {
          target = " target=" + element.attr("target");
        }
        let classes = ["menu-item"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }
        return format(
          '<th %s class="%s"><a href="%s"%s>%s</a></th>',
          attrs,
          classes.join(" "),
          element.attr("href"),
          target,
          inner,
        );
      }

      // <center>
      case this._components.center: {
        if (element.children().length > 0) {
          element.children().each(function () {
            $(this).attr("align", "center");
            $(this).addClass("float-center");
          });
          element.find("item, .menu-item").addClass("float-center");
        }

        element.attr("data-parsed", "");

        // Return the full element including the <center> wrapper
        return $.html(element);
      }

      // <callout>
      case this._components.callout: {
        let classes = ["callout-inner"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }

        return format(
          '<table %s class="callout"><tbody><tr><th class="%s">%s</th><th class="expander"></th></tr></tbody></table>',
          attrs,
          classes.join(" "),
          inner,
        );
      }

      // <spacer>
      case this._components.spacer: {
        let classes = ["spacer"];
        let size;
        let html = "";
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }
        if (element.attr("size-sm") || element.attr("size-lg")) {
          if (element.attr("size-sm")) {
            size = element.attr("size-sm");
            html += format(
              '<table %s class="%s hide-for-large"><tbody><tr><td height="' +
                size +
                '" style="font-size:' +
                size +
                "px;line-height:" +
                size +
                'px;">&nbsp;</td></tr></tbody></table>',
              attrs,
            );
          }
          if (element.attr("size-lg")) {
            size = element.attr("size-lg");
            html += format(
              '<table %s class="%s show-for-large"><tbody><tr><td height="' +
                size +
                '" style="font-size:' +
                size +
                "px;line-height:" +
                size +
                'px;">&nbsp;</td></tr></tbody></table>',
              attrs,
            );
          }
        } else {
          size = element.attr("size") || 16;
          html += format(
            '<table %s class="%s"><tbody><tr><td height="' +
              size +
              '" style="font-size:' +
              size +
              "px;line-height:" +
              size +
              'px;">&nbsp;</td></tr></tbody></table>',
            attrs,
          );
        }

        if (element.attr("size-sm") && element.attr("size-lg")) {
          return format(html, classes.join(" "), classes.join(" "), inner);
        }

        return format(html, classes.join(" "), inner);
      }

      // <wrapper>
      case this._components.wrapper: {
        let classes = ["wrapper"];
        if (element.attr("class")) {
          classes = classes.concat(element.attr("class")!.split(" "));
        }

        return format(
          '<table %s class="%s" align="center"><tbody><tr><td class="wrapper-inner">%s</td></tr></tbody></table>',
          attrs,
          classes.join(" "),
          inner,
        );
      }

      default:
        // If it's not a custom component, return it as-is
        return format("<tr><td>%s</td></tr>", element.html(element)!);
    }
  }

  private _makeColumn<Element extends AnyNode>(
    col: Cheerio<Element>,
    $: CheerioAPI,
  ): string {
    let output = "";
    const inner = col.html();
    let classes: string[] = [];
    let expander = "";
    const attrs = getAttrs(col, $);

    // Add 1 to include current column
    const colCount = col.siblings(this._components.columns).length + 1;

    // Inherit classes from the <column> tag
    const classAttr = col.attr("class");
    if (classAttr) {
      classes = classes.concat(classAttr.split(" "));
    }

    // Check for sizes. If no attribute is provided, default to small-12. Divide evenly for large columns
    const smallSize = col.attr("small") || this._columnCount;
    const largeSize =
      col.attr("large") ||
      col.attr("small") ||
      Math.floor(this._columnCount / colCount);
    const noExpander = col.attr("no-expander");

    classes.push(format("small-%s", smallSize));
    classes.push(format("large-%s", largeSize));

    // Add the basic "columns" class also
    classes.push("columns");

    // Determine if it's the first or last column, or both
    // Check for both unconverted <columns> tags and converted <th class="...columns..."> elements
    const prevColumns =
      col.prevAll(this._components.columns).length +
      col.prevAll("th.columns").length;
    const nextColumns =
      col.nextAll(this._components.columns).length +
      col.nextAll("th.columns").length;
    if (!prevColumns) classes.push("first");
    if (!nextColumns) classes.push("last");

    // If the column contains a nested row, the .expander class should not be used
    // The == on the first check is because we're comparing a string pulled from $.attr() to a number
    if (
      largeSize == this._columnCount &&
      col.find(".row, row").length === 0 &&
      (noExpander == undefined || noExpander == "false")
    ) {
      expander = '\n<th class="expander"></th>';
    }

    // Final HTML output
    output =
      '<th class="%s" %s><table><tbody><tr><th>%s</th>%s</tr></tbody></table></th>';

    return format(output, classes.join(" "), attrs, inner, expander);
  }
}
