module.exports = {
  siteMetadata: {
    title: `Name your NFTs with ENS`,
    description: `What better way to make it apparent your non fungible is one of a kind than by pointing an ENS name at it.`,
    author: `@oisinkyne`,
  },
  pathPrefix: '/',
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-theme-material-ui`,
    // // gatsby third party graphql apis
    // {
    //   resolve: "gatsby-source-graphql",
    //   options: {
    //     // This type will contain remote schema Query type
    //     typeName: "ENS",
    //     // This is the field under which it's accessible
    //     fieldName: "ens",
    //     // URL to query from
    //     url: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
    //   },
    // },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
