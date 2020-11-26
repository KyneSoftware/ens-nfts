import React from "react"
import { ThemeProvider, createMuiTheme } from "@material-ui/core";
import Layout from "../components/layout"
import SEO from "../components/seo"

// Website theme
const theme = createMuiTheme({
  palette: {
    primary: {
      main: `#000000`,
    },
    secondary: {
      main: `#f6c26c`,
    },
    info: {
      main: `#449DD1`
    },
  },
});

const NotFoundPage = () => (
  <ThemeProvider theme={theme}>
    <Layout>
      <SEO title="404: Not found" />
      <h1>Not Found</h1>
      <p>You just hit a route that doesn&#39;t exist, please file a bug report if you think this is a mistake.</p>
    </Layout>
  </ThemeProvider>
)

export default NotFoundPage
