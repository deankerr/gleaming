# Hono JSX: A Primer

Hono provides robust JSX support for both server-side and client-side rendering, offering a React-like development experience with a smaller footprint. This primer covers the key features and usage patterns for leveraging JSX in Hono applications.

## Overview

JSX in Hono allows you to write HTML templates using JavaScript XML syntax. It works in both server-side and client-side environments, with dedicated optimizations for each context.

## Basic Setup

To use JSX with Hono, your files should have the `.tsx` extension and your project must be configured properly:

```tsx
import { Hono } from 'hono'
import type { FC } from 'hono/jsx'

const app = new Hono()

const Layout: FC = (props) => {
  return (
    <html>
      <body>{props.children}</body>
    </html>
  )
}

const Page: FC<{ messages: string[] }> = (props) => {
  return (
    <Layout>
      <h1>Hello Hono!</h1>
      <ul>
        {props.messages.map((message) => {
          return <li>{message}</li>
        })}
      </ul>
    </Layout>
  )
}

app.get('/', (c) => {
  const messages = ['Good Morning', 'Good Evening', 'Good Night']
  return c.html(<Page messages={messages} />)
})

export default app
```

## Core Features

### Fragments

Fragments allow you to group multiple elements without adding extra nodes to the DOM:

```tsx
import { Fragment } from 'hono/jsx'

// Using the Fragment import
const List = () => (
  <Fragment>
    <p>first child</p>
    <p>second child</p>
  </Fragment>
)

// Or using shorthand syntax
const ShorthandList = () => (
  <>
    <p>first child</p>
    <p>second child</p>
  </>
)
```

### Props with Children

The `PropsWithChildren` type helps correctly type components that accept children:

```tsx
import { PropsWithChildren } from 'hono/jsx'

type CardProps = {
  title: string
}

function Card({ title, children }: PropsWithChildren<CardProps>) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-content">{children}</div>
    </div>
  )
}
```

### Raw HTML Insertion

For inserting raw HTML content (use with caution):

```tsx
const content = { __html: '<strong>Dynamically generated HTML</strong>' }
const Element = <div dangerouslySetInnerHTML={content} />
```

### Memoization

Optimize components by memoizing them, useful for static content:

```tsx
import { memo } from 'hono/jsx'

const Header = memo(() => <header>Welcome to Hono</header>)
const Footer = memo(() => <footer>Powered by Hono</footer>)

const Page = (
  <div>
    <Header />
    <main>Content goes here</main>
    <Footer />
  </div>
)
```

### CSS-in-JS with the CSS Helper

Hono provides a built-in CSS-in-JS solution via the `css` helper, allowing you to write CSS directly in your JSX components:

```tsx
import { css, Style } from 'hono/css'

const MyComponent = () => {
  const cardClass = css`
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 16px;
    margin: 16px;
  `
  const titleClass = css`
    color: #333;
    font-size: 1.5rem;
  `
  return (
    <>
      <Style /> {/* Don't forget to include the Style component */}
      <div class={cardClass}>
        <h2 class={titleClass}>Hello World</h2>
        <p>This is styled with Hono's css helper</p>
      </div>
    </>
  )
}
```

#### Key Features of the CSS Helper

1. **Pseudo-Classes and Nesting**

   Use the `&` selector for pseudo-classes and nesting:

   ```tsx
   const buttonClass = css`
     background-color: #0066cc;
     color: white;
     padding: 8px 16px;
     border-radius: 4px;
     border: none;
     cursor: pointer;

     &:hover {
       background-color: #0055aa;
     }
   `
   ```

2. **Extending CSS Definitions**

   Embed class names to extend styles:

   ```tsx
   const baseButtonClass = css`
     padding: 8px 16px;
     border-radius: 4px;
     cursor: pointer;
   `

   const primaryButtonClass = css`
     ${baseButtonClass}
     background-color: #0066cc;
     color: white;
   `

   const secondaryButtonClass = css`
     ${baseButtonClass}
     background-color: #eee;
     color: #333;
   `
   ```

3. **Nesting Selectors**

   Target child elements with nested selectors:

   ```tsx
   const cardClass = css`
     background: white;

     h1 {
       color: blue;
     }

     p {
       color: #555;
     }
   `

   // Usage
   return (
     <div class={cardClass}>
       <h1>Title</h1>
       <p>Paragraph with nested styles</p>
     </div>
   )
   ```

4. **Global Styles**

   Define global styles with the `:-hono-global` pseudo-selector:

   ```tsx
   const globalStyles = css`
     :-hono-global {
       body {
         font-family: system-ui, sans-serif;
         margin: 0;
         padding: 0;
       }

       a {
         color: #0066cc;
         text-decoration: none;
       }
     }
   `

   // Add global styles
   return (
     <html>
       <head>
         <Style />
       </head>
       <body class={globalStyles}>
         <h1>My App</h1>
       </body>
     </html>
   )
   ```

   Alternatively, write direct CSS in the Style component:

   ```tsx
   return (
     <html>
       <head>
         <Style>{css`
           body {
             font-family: system-ui, sans-serif;
             margin: 0;
             padding: 0;
           }
         `}</Style>
       </head>
       <body>
         <h1>My App</h1>
       </body>
     </html>
   )
   ```

5. **Keyframes for Animations**

   Create animations with the `keyframes` helper:

   ```tsx
   import { css, keyframes, Style } from 'hono/css'

   const fadeIn = keyframes`
     from {
       opacity: 0;
     }
     to {
       opacity: 1;
     }
   `

   const animatedClass = css`
     animation: ${fadeIn} 1s ease-in-out;
   `

   return (
     <>
       <Style />
       <div class={animatedClass}>This fades in</div>
     </>
   )
   ```

6. **Composing Classes with cx**

   Combine multiple classes with the `cx` helper:

   ```tsx
   import { css, cx, Style } from 'hono/css'

   const cardClass = css`
     border-radius: 8px;
     padding: 16px;
   `

   const highlightedClass = css`
     background-color: #fffde7;
     border-left: 4px solid #ffd600;
   `

   // Combine the classes
   return (
     <>
       <Style />
       <div class={cx(cardClass, highlightedClass)}>Highlighted card</div>
       <div class={cx(cardClass, 'custom-class')}>Card with additional custom class</div>
     </>
   )
   ```

7. **Using with Secure Headers**

   When using with the Secure Headers middleware, add the nonce attribute:

   ```tsx
   import { secureHeaders, NONCE } from 'hono/secure-headers'

   app.use(
     '*',
     secureHeaders({
       contentSecurityPolicy: {
         styleSrc: [NONCE],
       },
     }),
   )

   app.get('/', (c) => {
     const titleClass = css`
       color: blue;
     `
     return c.html(
       <html>
         <head>
           {/* Add the nonce attribute */}
           <Style nonce={c.get('secureHeadersNonce')} />
         </head>
         <body>
           <h1 class={titleClass}>Secure Page</h1>
         </body>
       </html>,
     )
   })
   ```

### Context API

Share data across the component tree without prop drilling:

```tsx
import { createContext, useContext } from 'hono/jsx'

// Define theme values
const themes = {
  light: { background: '#fff', color: '#000' },
  dark: { background: '#222', color: '#fff' },
}

// Create context with default value
const ThemeContext = createContext(themes.light)

// Consumer component
const ThemedButton = () => {
  const theme = useContext(ThemeContext)
  return <button style={theme}>Click me</button>
}

// Provider usage
app.get('/', (c) => {
  return c.html(
    <div>
      <ThemeContext.Provider value={themes.dark}>
        <ThemedButton />
      </ThemeContext.Provider>
    </div>,
  )
})
```

### Async Components

Hono supports async components, which can fetch data or perform other async operations:

```tsx
const DataComponent = async () => {
  // Simulate data fetching
  const data = await fetchData()
  return (
    <div>
      {data.map((item) => (
        <p key={item.id}>{item.name}</p>
      ))}
    </div>
  )
}

app.get('/data', (c) => {
  return c.html(
    <html>
      <body>
        <DataComponent />
      </body>
    </html>,
  )
})
```

## Experimental Features

### Suspense

Suspense allows you to show a fallback while content is loading (works with streaming):

```tsx
import { renderToReadableStream, Suspense } from 'hono/jsx/streaming'

const DataComponent = async () => {
  const data = await fetchData() // This operation suspends
  return <div>{/* Render data */}</div>
}

app.get('/stream', (c) => {
  const stream = renderToReadableStream(
    <html>
      <body>
        <Suspense fallback={<div>Loading data...</div>}>
          <DataComponent />
        </Suspense>
      </body>
    </html>,
  )

  return c.body(stream, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Transfer-Encoding': 'chunked',
    },
  })
})
```

### ErrorBoundary

Catch errors in child components and display fallback content:

```tsx
import { ErrorBoundary } from 'hono/jsx'

const PotentiallyErrorComponent = () => {
  // This might throw an error
  if (somethingWrong) {
    throw new Error('Something went wrong')
  }
  return <div>Component content</div>
}

app.get('/with-error-handling', (c) => {
  return c.html(
    <html>
      <body>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <PotentiallyErrorComponent />
        </ErrorBoundary>
      </body>
    </html>,
  )
})
```

ErrorBoundary also works with Suspense:

```tsx
app.get('/with-suspense-and-errors', (c) => {
  return c.html(
    <html>
      <body>
        <ErrorBoundary fallback={<div>Error occurred</div>}>
          <Suspense fallback={<div>Loading...</div>}>
            <AsyncComponent />
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>,
  )
})
```

## JSX Renderer Middleware

The JSX Renderer middleware simplifies layout setup and gives components access to the request context:

```tsx
import { Hono } from 'hono'
import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'

const app = new Hono()

// Set up the layout
app.use(
  '/*',
  jsxRenderer(({ children }) => {
    return (
      <html>
        <head>
          <title>My Hono App</title>
          <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
          <main>{children}</main>
          <footer>© 2025 My App</footer>
        </body>
      </html>
    )
  }),
)

// Component that uses request context
const UserGreeting = () => {
  const c = useRequestContext()
  const name = c.req.query('name') || 'Guest'
  return <h2>Hello, {name}!</h2>
}

// Routes
app.get('/', (c) => {
  return c.render(<UserGreeting />)
})

app.get('/about', (c) => {
  return c.render(<h1>About Us</h1>)
})

export default app
```

### Extending ContextRenderer

You can extend ContextRenderer to pass additional props to the layout:

```tsx
// Type extension
declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props: { title?: string; meta?: string }): Response
  }
}

// Middleware setup with props
app.use(
  '/*',
  jsxRenderer(({ children, title, meta }) => {
    return (
      <html>
        <head>
          <title>{title || 'Default Title'}</title>
          {meta && <meta name="description" content={meta} />}
        </head>
        <body>{children}</body>
      </html>
    )
  }),
)

// Usage in route
app.get('/page', (c) => {
  return c.render(<div>Page content</div>, {
    title: 'Page Title',
    meta: 'Page description for SEO',
  })
})
```

## Integration with html Middleware

JSX can be combined with Hono's html template literal middleware for flexible templating:

```tsx
import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

// HTML template literal for layout
const Layout = (props: { title: string; children?: any }) => html`
  <!DOCTYPE html>
  <html>
    <head>
      <title>${props.title}</title>
    </head>
    <body>
      ${props.children}
    </body>
  </html>
`

// JSX component using the html layout
const Page = (props: { title: string; username: string }) => (
  <Layout title={props.title}>
    <h1>Welcome, {props.username}</h1>
  </Layout>
)

app.get('/:username', (c) => {
  const { username } = c.req.param()
  return c.html(<Page title="Welcome Page" username={username} />)
})

export default app
```

## Custom Elements and Attributes

You can extend JSX typings to support custom elements and attributes:

```tsx
// In a declaration file or at the top of your main file
declare module 'hono/jsx' {
  namespace JSX {
    interface IntrinsicElements {
      'custom-element': HTMLAttributes & {
        'data-custom'?: string
        'on-event'?: string
      }
    }
  }
}

// Usage
const CustomElementComponent = () => (
  <custom-element data-custom="value" on-event="handleEvent()">
    Content inside custom element
  </custom-element>
)
```

## Client Components (hono/jsx/dom)

Hono also supports client-side rendering with a minimal runtime (2.8KB with Brotli):

```tsx
// Client-side counter example
import { useState } from 'hono/jsx'
import { render } from 'hono/jsx/dom'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

// Mount to DOM
const root = document.getElementById('app')
render(<Counter />, root)
```

Client Components can use most of the same React-compatible Hooks including:

- useState
- useEffect
- useRef
- useContext
- useMemo
- useCallback
- useReducer
- and more

## Usage Patterns and Best Practices

1. **Component Organization**:

   - Create reusable components for UI elements
   - Separate layout components from content components
   - Use TypeScript for prop type safety

2. **Server-Side Rendering**:

   - Use `c.html()` for basic rendering
   - Use the JSX Renderer middleware for layouts
   - Consider streaming for large pages or async content

3. **Performance Optimization**:

   - Use `memo()` for static components
   - Apply appropriate caching mechanisms
   - Keep components small and focused

4. **Data Handling**:

   - Use Context for shared state
   - Leverage async components for data fetching
   - Consider bundling data with initial HTML to avoid waterfalls

5. **Styling**:
   - Use the CSS helper for component-scoped styles
   - Apply global styles with the `:-hono-global` selector
   - Consider VS Code's styled-components extension for better syntax highlighting
