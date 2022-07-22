/// <reference types="cypress" />

import { verify } from "crypto";
import { navigateToStartPage } from "../../support/navigateToStartPage";
import { fileLoader } from "../../support/fileLoader";

// Welcome to Koia!
//

describe("first example", () => {
  before(() => {
    // Cypress starts Koia.io for each test
    cy.clearIndexedDB();
    navigateToStartPage();
    fileLoader("test-us.csv");
  });

  beforeEach(() => {
    cy.get(".input_source_format").clear(); //SourceDateFormat
  });

  it("check date preview initial", () => {
    //cy.get(".but_activate_scene").click({ force: true });

    cy.get(".select_display_format").click().get("#mat-option-147").click();
    // todo workaround to update preview
    cy.get(".select_data_type").eq(2).click();
    cy.get("#mat-option-151 > .mat-option-text").click();
    cy.get(".select_data_type").eq(2).click();
    cy.get("#mat-option-150 > .mat-option-text").click();
    cy.checkCellData(" 17 Jun 2022 14:26:22 123 ");
    expect("tbody > :nth-child(2) > :nth-child(1) > .mat-tooltip-trigger")
      .exist;
  });

  it("check date preview YYYY.MM.dd HH:mm:ss.SSS", () => {
    //cy.get(".but_activate_scene").click({ force: true });
    cy.get(".input_source_format").type("dd.MM.YYYY HH:mm:ss.SSS").click(); //SourceDateFormat
    cy.get(".select_data_type").click;

    cy.get(".select_display_format").click().get("#mat-option-147").click();
    // todo workaround to update preview
    cy.get(".select_data_type").eq(2).click();
    cy.get("#mat-option-151 > .mat-option-text").click();
    cy.get(".select_data_type").eq(2).click();
    cy.get("#mat-option-150 > .mat-option-text").click();
    cy.checkCellData(" 17 Jun 2022 14:26:22 123 ");
    expect("tbody > :nth-child(2) > :nth-child(1) > .mat-tooltip-trigger")
      .exist;
  });

  it("check date preview  YYYY.MM.dd HH:mm:ss", () => {
    cy.get(".input_source_format").type("dd.MM.YYYY HH:mm:ss.SSS").click(); //SourceDateFormat
    cy.get(".select_data_type").click;
    cy.get(".select_display_format").click().get("#mat-option-146").click();
    cy.checkCellData(" 17 Jun 2022 14:26:22 ");
  });

  it("check date preview  YYYY.MM.dd HH:mm", () => {
    cy.get(".input_source_format").type("dd.MM.YYYY HH:mm:ss.SSS").click(); //SourceDateFormat
    cy.get(".select_data_type").click;
    cy.get(".select_display_format").click().get("#mat-option-145").click();
    cy.checkCellData(" 17 Jun 2022 14:26 ");
  });

  it("check date preview YYYY.MM.dd HH", () => {
    cy.get(".input_source_format").type("dd.MM.YYYY HH:mm:ss.SSS").click(); //SourceDateFormat
    cy.get(".select_data_type").click;
    cy.get(".select_display_format").click().get("#mat-option-144").click();
    cy.checkCellData(" 17 Jun 2022 14 ");
  });

  it("check date preview YYYY.MM.dd", () => {
    cy.get(".input_source_format").type("dd.MM.YYYY HH:mm:ss.SSS").click(); //SourceDateFormat
    cy.get(".select_data_type").click;
    cy.get(".select_display_format").click().get("#mat-option-143").click();
    cy.checkCellData(" 17 Jun 2022 ");
  });
  it("check date preview YYYY.MM", () => {
    cy.get(".input_source_format").type("dd.MM.YYYY HH:mm:ss.SSS").click(); //SourceDateFormat
    cy.get(".select_data_type").click;
    cy.get(".select_display_format").click().get("#mat-option-142").click();
    cy.checkCellData(" Jun 2022 ");
  });
  it("check date preview YYYY", () => {
    cy.get(".input_source_format").type("dd.MM.YYYY HH:mm:ss.SSS").click(); //SourceDateFormat
    cy.get(".select_data_type").click;
    cy.get(".select_display_format").click().get("#mat-option-141").click();
    cy.checkCellData(" 2022 ");
  });
});
