// jest.teardown.js
module.exports = async () => {
  console.log('Forcing Jest to exit via globalTeardown...');
  process.exit(0);
};