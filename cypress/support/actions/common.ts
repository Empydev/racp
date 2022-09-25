/**
 * Opens a SliderMenu of the given name and updates its sliders with the new values
 */
export function menuSlide(name: string, newValueOrValues: number | number[]) {
  cy.findByRole("textbox", { name }).click();
  cy.findAllByRole("slider", { name, hidden: true }).slide(newValueOrValues);
  cy.closePoppers();
}

export function waitForLoadingSpinner(testId = "loading-spinner") {
  cy.findByTestId(testId).shouldExistTemporarily();
}
