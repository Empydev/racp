import { gotoItem, listItems } from "../support/actions/nav";
import {
  expectTableColumn,
  findRowById,
  findTableColumn,
} from "../support/actions/grid";
import {
  compareNumeric,
  compareStrings,
  compareThousands,
} from "../support/util";
import { menuSlide } from "../support/actions/common";
import { signInAsAdmin, uploadAssets } from "../support/actions/admin";
import { generateSearchPageTests } from "../support/actions/search";

// Some searches require assets to function
before(() => {
  cy.visit("/");
  signInAsAdmin();
  uploadAssets();
});

describe("search", () => {
  before(listItems);
  generateSearchPageTests({
    searches: {
      id: {
        input: () => cy.findByLabelText("ID").type("501"),
        verify: () => findRowById(501),
      },
      name: {
        input: () => cy.findByLabelText("Name").type("potion"),
        verify: () => expectTableColumn("Name", () => /potion/i),
      },
      "primary type": {
        input: () => cy.get(`#PrimaryType`).select("Weapon"),
        verify: () => findTableColumn("Name").contains("Sword"),
      },
      "sub type": {
        input: () => {
          cy.get(`#PrimaryType`).select("Weapon");
          cy.get("#Subtype").select("Katar");
        },
        verify: () => findTableColumn("Name").contains("Jur"),
      },
      class: {
        input: () => cy.get("#Class").select("Third"),
        verify: () => findTableColumn("Name").contains("Witch's Staff"),
      },
      job: {
        input: () => cy.get("#Job").select("Summoner"),
        verify: () => findTableColumn("Name").contains(/Foxtail/i),
      },
      element: {
        input: () => cy.get("#Element").select("Dark"),
        verify: () => findTableColumn("Name").contains("Shadow Armor Scroll"),
      },
      status: {
        input: () => cy.get("#Status").select("Bleeding"),
        verify: () => findTableColumn("Name").contains("Muscle Cutter"),
      },
      race: {
        input: () => cy.get("#Race").select("Angel"),
        verify: () => findTableColumn("Name").contains("Royal Knuckle"),
      },
      description: {
        input: () =>
          cy
            .findByLabelText("Description contains")
            .type("Identified Description"),
        verify: () => findTableColumn("Name").contains("Red Potion"),
      },
      script: {
        input: () => cy.findByLabelText("Script contains").type("getrefine()"),
        verify: () => findTableColumn("Name").contains("Death Guidance"),
      },
      slots: {
        input: () => menuSlide("Slots", [2, 3]),
        verify: () =>
          expectTableColumn("Slots", () => (text) => +text >= 2 && +text <= 2),
      },
      sellPrice: {
        input: () => {
          cy.findByLabelText("Sell Value (min)").type("10000");
          cy.findByLabelText("Sell Value (max)").type("20000");
        },
        verify: () =>
          expectTableColumn(
            "Sell Value",
            () => (text) =>
              parseFloat(text) >= 10000 && parseFloat(text) <= 20000
          ),
      },
    },
    sorts: {
      // Expect name sorting to be done ignoring slots
      Name: (a, b) => compareStrings(trimSlots(a), trimSlots(b)),
      "Sell Value": compareThousands,
      Weight: compareNumeric,
      Atk: compareNumeric,
      MAtk: compareNumeric,
      Def: compareNumeric,
      "Min Level": compareNumeric,
      "Max Level": compareNumeric,
      Slots: compareNumeric,
    },
  });
});

describe("details", () => {
  before(() => gotoItem(505));

  it("can list droppers", () => {
    findTableColumn("Monster")
      .contains("contain", /doppelganger/i)
      .and("contain", /nightmare/i)
      .and("contain", /tao gunka/i);
  });

  it("can list sellers", () => {
    findTableColumn("Shop").contains("contain", /para_ptn10/i);
  });
});

describe("assets", () => {
  before(() => gotoItem(501));

  it("exists", () => cy.contains("Red Potion"));

  it("has client texts", () => {
    cy.contains("Red Potion Identified Display Name");
    cy.contains("Red Potion Identified Description");
  });

  it("has image", () => {
    cy.findByRole("img", { name: "Red Potion" }).isFixtureImage(
      "red_potion.png"
    );
  });
});

const trimSlots = (str: string) => /^(.*?)\s*\[\d+]/.exec(str)?.[1] ?? str;
