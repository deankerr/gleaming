import { FC } from 'hono/jsx'

export interface NavigationProps {
  currentPath: string
}

export const Navigation: FC<NavigationProps> = ({ currentPath }) => {
  const links = [
    { href: '/dev/gallery', label: 'Image Gallery' },
    { href: '/dev/files', label: 'Files List' },
  ]

  return (
    <nav>
      <style>{`
        .nav-container {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          background-color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .nav-link {
          text-decoration: none;
          color: #333;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s, color 0.2s;
        }
        .nav-link:hover {
          background-color: #f0f0f0;
        }
        .nav-link.active {
          background-color: #0066cc;
          color: white;
        }
        .nav-link.active:hover {
          background-color: #0055aa;
        }
      `}</style>

      <div class="nav-container">
        {links.map((link) => (
          <a href={link.href} class={`nav-link ${currentPath === link.href ? 'active' : ''}`}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
