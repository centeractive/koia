Cypress.Commands.add("clearIndexedDB", async () => {
  const databases = await window.indexedDB.databases();

  await Promise.all(
    databases.map(
      ({ name }) =>
        new Promise((resolve, reject) => {
          const request = window.indexedDB.deleteDatabase(name);

          request.addEventListener("success", resolve);
          // Note: we need to also listen to the "blocked" event
          // (and resolve the promise) due to https://stackoverflow.com/a/35141818
          request.addEventListener("blocked", resolve);
          request.addEventListener("error", reject);
        })
    )
  );
});
