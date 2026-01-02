import { compare } from "./lib/compare";

describe("Doc Examples", () => {
  it(`can replicate introduction example from Inky docs (https://get.foundation/emails/docs/inky.html)`, () => {
    const input =
      "<container><row><columns>Put content in me!</columns></row></container>";
    const expected = `
  <table align="center" class="container">
    <tbody>
      <tr>
        <td>
          <table class="row">
            <tbody>
              <tr>
                <th class="small-12 large-12 columns first last">
                  <table>
                    <tbody>
                      <tr>
                        <th>Put content in me!</th>
                        <th class="expander"></th>
                      </tr>
                    </tbody>
                  </table>
                </th>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>`;
    compare(input, expected);
  });

  it(`can replicate thumbnail example from Inky docs (https://get.foundation/emails/docs/thumbnail.html)`, () => {
    const input = '<img src="https://placehold.it/200x200" class="thumbnail">';
    const expected = `<img src="https://placehold.it/200x200" class="thumbnail"/>`;
    compare(input, expected);
  });
});
