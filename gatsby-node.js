const pth = require('path')
const {isFuture, parseISO} = require('date-fns')
const currency = require('currency.js')

/* TEMPLATES */
const templates = {
  baseDir: 'src/templates',
  project: 'project.js', // example app
  projects: {
    // index: 'projects/index.js', added as a gatsby page
    project: 'projects/project.js',
    category: 'projects/category.js'
  },
  shop: {
    // index: 'shop/index.js', added as a gatsby page
    product: 'shop/product.js',
    category: 'shop/category.js'
  }
}

async function createExampleProjectPages (graphql, actions, reporter) {
  const {createPage} = actions
  const result = await graphql(`
    {
      allSanitySampleProject(filter: {slug: {current: {ne: null}}, publishedAt: {ne: null}}) {
        edges {
          node {
            id
            publishedAt
            slug {
              current
            }
          }
        }
      }
    }
  `)
  if (result.errors) throw result.errors
  const projectEdges = (result.data.allSanitySampleProject || {}).edges || []
  projectEdges
    .filter(edge => !isFuture(parseISO(edge.node.publishedAt)))
    .forEach(edge => {
      const id = edge.node.id
      const slug = edge.node.slug.current
      const path = `/project/${slug}/`

      reporter.info(`Creating project page: ${path}`)

      createPage({
        path,
        component: pth.resolve(pth.join(templates.baseDir, templates.project)),
        context: {id}
      })
    })
}

/*
    PROJECTS / PROJECT
*/

async function createProjectPages (graphql, actions, reporter) {
  const {createPage} = actions
  const result = await graphql(`
    {
      query: allSanityProject(filter: {slug: {current: {ne: null}}, publishedAt: {ne: null}}) {
        edges {
          node {
            id
            publishedAt
            category {
              id
              slug {
                current
              }
            }
            slug {
              current
            }
          }
        }
      }
    }
  `)
  if (result.errors) throw result.errors
  const edges = (result.data.query || {}).edges || []
  edges
    .filter(edge => !isFuture(parseISO(edge.node.publishedAt)))
    .forEach(edge => {
      const {
        node: {
          id: project,
          slug: {current: slug},
          category: {
            id: category,
            slug: {current: categorySlug}
          }
        }
      } = edge
      const path = `/${categorySlug}/${slug}/`
      reporter.info(`Creating project page: ${path}`)
      createPage({
        path,
        component: pth.resolve(pth.join(templates.baseDir, templates.projects.project)),
        context: {
          project,
          category
        }
      })
    })
}

/*
    SHOP / PRODUCTS
*/
async function createShopProductPages (graphql, actions, reporter) {
  const {createPage} = actions
  const result = await graphql(`
    {
      query: allSanityProduct(filter: {slug: {current: {ne: null}}}) {
        edges {
          node {
            id
            slug {
              current
            }
            category {
              id
              slug {
                current
              }
            }
            variants {
              variantGroup {
                id
              }
            }
          }
        }
      }
    }
  `)
  if (result.errors) throw result.errors
  const edges = (result.data.query || {}).edges || []
  edges
    .filter(edge => !isFuture(parseISO(edge.node.publishedAt)))
    .forEach(edge => {
      const {
        node: {
          id: product,
          slug: {current: slug},
          category: {
            id: category,
            slug: {current: categorySlug}
          },
          variants
        }
      } = edge
      const variantGroupsIds = variants.reduce((acc, el) => {
        return acc === null ? [el.variantGroup.id] : [...acc, el.variantGroup.id]
      }, null)
      const path = `/${categorySlug}/${slug}/`
      reporter.info(`Creating product page: ${path}`)
      createPage({
        path,
        component: pth.resolve(pth.join(templates.baseDir, templates.shop.product)),
        context: {
          product,
          category,
          variantGroupsIds
        }
      })
    })
}

/*
    SHOP / CATEGORIES
*/
async function createShopCategoryPages (graphql, actions, reporter) {
  const {createPage} = actions
  const result = await graphql(`
    {
      query: allSanityProductCategory(filter: {slug: {current: {ne: null}}}) {
        edges {
          node {
            id
            slug {
              current
            }
          }
        }
      }
    }
  `)
  if (result.errors) throw result.errors
  const edges = (result.data.query || {}).edges || []
  edges.forEach(edge => {
    const {
      node: {
        id: category,
        slug: {current: slug}
      }
    } = edge
    const path = `/${slug}/`
    reporter.info(`Creating category page: ${path}`)
    createPage({
      path,
      component: pth.resolve(pth.join(templates.baseDir, templates.shop.category)),
      context: {
        category
      }
    })
  })
}

exports.createPages = async ({graphql, actions, reporter}) => {
  await createExampleProjectPages(graphql, actions, reporter)
  await createProjectPages(graphql, actions, reporter)
  await createShopProductPages(graphql, actions, reporter)
  await createShopCategoryPages(graphql, actions, reporter)
}

exports.createResolvers = ({createResolvers}) => {
  createResolvers({
    SanityPrice: {
      formatted: {
        type: 'String!',
        resolve: source => {
          return currency(source.value, {decimal: ','}).format() + ' €'
        }
      }
    }
  })
}
