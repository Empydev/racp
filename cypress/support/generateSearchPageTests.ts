import { without } from "lodash";
import { waitForPageReady } from "./actions/common";
import { findDataCells, findDataRowIds, sortGridBy } from "./actions/grid";
import { CompareFn, invertCompareFn } from "./util";

export function generateSearchPageTests({
  gotoPage,
  searches,
  sorts,
}: {
  gotoPage: Function;
  searches: Record<string, { input: Function; verify: Function }>;
  sorts: Record<string, CompareFn>;
}) {
  // Lazy test: doesn't test all possible pagination options.
  // This test assumes that the implementation uses a generic solution
  // and that if one pagination option works, they all work.
  it("can paginate", () => {
    cy.visit("/");
    gotoPage();
    findDataRowIds().then((idsBeforePagination) => {
      cy.findByRole("button", { name: "Go to next page" }).click();
      waitForPageReady();
      findDataRowIds().then((idsAfterPagination) => {
        const newIds = without(idsAfterPagination, ...idsBeforePagination);
        expect(newIds).to.deep.equal(
          idsAfterPagination,
          "Next page should only have new rows"
        );
      });
    });
  });

  describe("can search by", () => {
    // Reload page before each search to reset search filter
    beforeEach(() => {
      cy.visit("/");
      gotoPage();
    });

    Object.entries(searches).forEach(([name, { input, verify }]) => {
      it(name, () => {
        input();
        waitForPageReady();
        verify();
      });
    });
  });

  describe("can filter by", () => {
    // Only a single page load is necessary since we can only have one sort active
    before(() => {
      cy.visit("/");
      gotoPage();
    });

    Object.entries(sorts).forEach(([name, compareFn]) => {
      describe(name, () => {
        it("asc", () => {
          sortGridBy(name, "asc");
          waitForPageReady();
          findDataCells(name).shouldBeSortedBy(compareFn);
        });
        it("desc", () => {
          sortGridBy(name, "desc");
          waitForPageReady();
          findDataCells(name).shouldBeSortedBy(invertCompareFn(compareFn));
        });
      });
    });
  });
}