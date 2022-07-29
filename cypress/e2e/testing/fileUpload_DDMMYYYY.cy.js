/// <reference types="cypress" />

import { verify } from "crypto";
import { navigateToStartPage } from "../../support/navigateToStartPage";
import { fileLoader } from "../../support/fileLoader";
import { setInputSourceFormat } from "../../support/setInputSourceFormat";
import { setDisplayFormat } from "../../support/setDisplayFormat";
import { workaround } from "../../support/workaround";
import * as constants from "../../support/constants";

// Welcome to Koia!
//

describe("first example", () => {
  before(() => {
    // Cypress starts Koia.io for each test
    cy.clearIndexedDB();
    navigateToStartPage();
    fileLoader("test-ddMMYYYY.csv");
  });

  beforeEach(() => {
    cy.get(".select_data_type").eq(0).click();
    cy.get("#mat-option-140 > .mat-option-text").click();

    // todo   cy.get(".input_source_format").clear(); //SourceDateFormat
  });

  it("check date preview initial", () => {
    //cy.get(".but_activate_scene").click({ force: true });
    cy.get(".select_data_type").eq(1).click();
    cy.get(".select_display_format")
      .eq(0)
      .get(".mat-option-text")
      .eq(1)
      .click({ force: true });
    // todo workaround to update preview
    workaround();
    cy.checkCellData("  ");
    expect("tbody > :nth-child(2) > :nth-child(1) > .mat-tooltip-trigger")
      .exist;
  });

  it("check date preview YYYY.MM.dd HH:mm:ss.SSS", () => {
    setInputSourceFormat(constants.const_inputSourceFormat);
    setDisplayFormat(constants.const_dd_MMM_YYYY_HH_mm_ss_SSS);
    workaround();
    cy.checkCellData(" 17 Jun 2022 14:26:22 123 ");
  });

  it("check date preview YYYY.MM.dd HH:mm:ss", () => {
    setInputSourceFormat(constants.const_inputSourceFormat);
    setDisplayFormat(constants.const_dd_MMM_YYYY_HH_mm_ss);
    workaround();
    cy.checkCellData(" 17 Jun 2022 14:26:22 ");
  });

  it("check date preview YYYY.MM.dd HH:mm", () => {
    setInputSourceFormat(constants.const_inputSourceFormat);
    setDisplayFormat(constants.const_dd_MMM_YYYY_HH_mm);
    workaround();
    cy.checkCellData(" 17 Jun 2022 14:26 ");
  });

  it("check date preview YYYY.MM.dd HH", () => {
    setInputSourceFormat(constants.const_inputSourceFormat);
    setDisplayFormat(constants.const_dd_MMM_YYYY_HH);
    workaround();
    cy.checkCellData(" 17 Jun 2022 14 ");
  });

  it("check date preview YYYY.MM.dd", () => {
    setInputSourceFormat(constants.const_inputSourceFormat);
    setDisplayFormat(constants.const_dd_MMM_YYYY);
    workaround();
    cy.checkCellData(" 17 Jun 2022 ");
  });

  it("check date preview YYYY.MM ", () => {
    setInputSourceFormat(constants.const_inputSourceFormat);
    setInputSourceFormat(constants.const_inputSourceFormat);
    setDisplayFormat(constants.const_MMM_YYYY);
    workaround();
    cy.checkCellData(" Jun 2022 ");
  });

  it("check date preview YYYY ", () => {
    setInputSourceFormat(constants.const_inputSourceFormat);
    setDisplayFormat(constants.const_YYYY);
    workaround();
    cy.checkCellData(" 2022 ");
  });
});
