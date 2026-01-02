import Inky from "../../index";
import * as cheerio from "cheerio";

/**
 * Takes HTML input, runs it through the Inky parser, and compares the output to what's expected.
 * @param input - HTML input.
 * @param expected - Expected HTML output.
 * @param cheerioOpts - Optional cheerio options.
 * @throws Throws an error if the output is not identical.
 */
export function compare(input: string, expected: string): void {
  const inky = new Inky({
    cheerio: {
      xml: {
        decodeEntities: false,
        xmlMode: true,
      },
    },
  });
  const output = inky.releaseTheKraken(input);

  // Normalize both strings by parsing and serializing them, then removing whitespace
  const normalizeHtml = (html: string): string => {
    // const $ = cheerio.load(html, {
    //   xml: {
    //     decodeEntities: false,
    //     xmlMode: true,
    //   },
    // });
    // Get HTML and normalize whitespace between tags
    // return $.html()
    return html.trim().replace(/>\s+</g, "><").replace(/\s+/g, " ");
  };

  const normalizedOutput = normalizeHtml(output);
  const normalizedExpected = normalizeHtml(expected);

  expect(normalizedOutput).toBe(normalizedExpected);
}
