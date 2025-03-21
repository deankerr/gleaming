import { FC } from 'hono/jsx'
import { html } from 'hono/html'
import { Navigation } from './Navigation'

export interface LayoutProps {
  title: string
  description?: string
  count?: number
  children?: any
  currentPath: string
}

export const Layout: FC<LayoutProps> = ({ title, description, count, children, currentPath }) => {
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} - Dev</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f7;
            color: #333;
            line-height: 1.5;
          }
          h1 {
            margin-bottom: 10px;
            color: #1d1d1f;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .count {
            font-size: 16px;
            color: #666;
            padding: 4px 10px;
            background-color: white;
            border-radius: 6px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          .description {
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        ${Navigation({ currentPath })}
        <div class="header">
          <div>
            <h1>${title}</h1>
            ${description ? html`<p class="description">${description}</p>` : ''}
          </div>
          ${count !== undefined ? html`<span class="count">${count} items</span>` : ''}
        </div>
        ${children}
      </body>
    </html>
  `
}
