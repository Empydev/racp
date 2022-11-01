import { gotoMainMenuPage } from "../support/actions/nav";
import { register, signOut } from "../support/actions/user";
import { nextTestUser, TestUser } from "../fixtures/users";
import { ignoreCase } from "../support/util";
import { expectTableColumn } from "../support/actions/grid";
import { resetData } from "../support/actions/admin";
import { waitForPageReady } from "../support/actions/common";

before(resetData);

let user: TestUser;
function gotoHuntsPageAsNewUser() {
  cy.visit("/"); // New visitor each test is a quicker way to get a clean slate than resetting all data
  user = nextTestUser();
  register(user.name, user.password, user.email);
  gotoMainMenuPage("Hunt");
}

const defaultHuntName = "new hunt";

describe("list", () => {
  beforeEach(() => {
    gotoHuntsPageAsNewUser();
    cy.findByRole("button", { name: /create new hunt/i }).click();
    waitForPageReady();
  });

  it("can create new hunt", () => {
    findListedHuntTitle(defaultHuntName).should("exist");
  });

  it("can rename hunt", () => {
    findListedHuntTitle(defaultHuntName).clear().type("renamed hunt");
    findListedHuntTitle("renamed hunt").should("exist");
  });

  it("can delete hunt", () => {
    cy.findByRole("button", { name: /delete hunt/i }).click();
    cy.findByRole("dialog").findByRole("button", { name: /ok/i }).click();
    findListedHuntTitle(defaultHuntName).should("not.exist");
  });
});

describe("details", () => {
  before(() => {
    gotoHuntsPageAsNewUser();
    createHuntWithData({ itemAmount: 5, killsPerUnit: 7 });
  });

  it("can add item", () => {
    withinItemGrid(() => expectTableColumn("Item", () => /test item/i));
  });

  it("can estimate farm time in kills per minute", () => {
    cy.get("#KillScale").select("Kills per minute");
    withinItemGrid(() => {
      expectTableColumn("Estimate", () => /57s/i);
    });
  });

  it("can estimate farm time in kills per minute", () => {
    cy.get("#KillScale").select("Kills per hour");
    withinItemGrid(() => {
      expectTableColumn("Estimate", () => /57m 8s/i);
    });
  });

  it("can estimate farm time in kills per minute", () => {
    cy.get("#KillScale").select("Kills per day");
    withinItemGrid(() => {
      expectTableColumn("Estimate", () => /22h 51m/i);
    });
  });

  it("can estimate farm time using multiplier", () => {
    cy.get("#KillScale").select("Kills per day");
    cy.findByLabelText("Drop Rate Multiplier").clear().type("15");
    withinItemGrid(() => {
      expectTableColumn("Estimate", () => /1h 31m/i);
    });
  });

  it("can remove item", () => {
    withinItemGrid(() => {
      cy.findByRole("button", { name: /remove item/i }).click();
      cy.contains("No items have been added to the hunt");
    });
  });
});

describe("sharing", () => {
  let notYourHuntUrl: string;
  before(() => {
    gotoHuntsPageAsNewUser();
    createHuntWithData({ itemAmount: 4, killsPerUnit: 8 });
    cy.url().then((url) => (notYourHuntUrl = url));
    signOut();
  });

  it("can view someone else's hunt as guest", () => {
    cy.visit(notYourHuntUrl);
    waitForPageReady();

    withinItemGrid(() => {
      expectTableColumn("Item", () => /test item \[3]/i);
      expectTableColumn("Amount", () => /^4$/);
      expectTableColumn("Estimate", () => /^40s$/i);
    });

    withinMonsterGrid(() => {
      expectTableColumn("Monster", () => /test monster/i);
      expectTableColumn(/map/i, () => /test_map/i);
      expectTableColumn("Kills per minute", () => /^8$/);
    });
  });

  it("can not see other users hunts in my own list", () => {
    gotoHuntsPageAsNewUser();
    findListedHuntTitle(defaultHuntName).should("not.exist");
  });
});

function findListedHuntTitle(huntName: string) {
  return cy.findByRole("heading", { name: ignoreCase(huntName) });
}

function createHuntWithData({ itemAmount = 1, killsPerUnit = 1 }) {
  const name = "test item";
  const nameRegex = ignoreCase(name, { exact: false });

  cy.findByRole("button", { name: /create new hunt/i }).click();
  waitForPageReady();
  cy.findByRole("link", { name: /view hunt/i }).click();
  waitForPageReady();

  cy.findByLabelText("Add an item to hunt").type(name);
  waitForPageReady();
  cy.findByRole("option", { name: nameRegex }).click();
  waitForPageReady();

  cy.get("#ItemAmount").clear().type(`${itemAmount}`);
  waitForPageReady();
  cy.get("#ItemTargets").select(0);
  waitForPageReady();

  cy.get("#KillsPerUnit").clear().type(`${killsPerUnit}`);
  waitForPageReady();
  cy.get("#MonsterSpawn").select(0);
  waitForPageReady();
}

function withinItemGrid(fn: () => void) {
  cy.findByRole("grid", { name: /items/i }).within(fn);
}

function withinMonsterGrid(fn: () => void) {
  cy.findByRole("grid", { name: /monsters/i }).within(fn);
}
