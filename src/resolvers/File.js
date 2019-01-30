const File = {
  path: async ({ path }, _, { url }, info) => `${url}/${path}`,
}

module.exports = { File }