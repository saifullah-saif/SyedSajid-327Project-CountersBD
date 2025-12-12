"use client"
import { colors } from "@/theme"

export default function ThemeExample() {
  // You can access colors directly in your component
  const primaryColor = colors.primary[600]
  const backgroundColor = colors.background.DEFAULT

  return (
    <div className="p-6 rounded-lg bg-background-50">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">Theme Colors</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Primary Colors */}
        <div className="space-y-2">
          <h3 className="font-medium">Primary</h3>
          <div className="space-y-1">
            {Object.entries(colors.primary).map(([shade, color]) => (
              <div key={shade} className="flex items-center">
                <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: color }} />
                <span className="text-sm text-text-secondary">
                  {shade}: {color}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Background Colors */}
        <div className="space-y-2">
          <h3 className="font-medium">Background</h3>
          <div className="space-y-1">
            {Object.entries(colors.background).map(([shade, color]) => (
              <div key={shade} className="flex items-center">
                <div className="w-6 h-6 rounded mr-2 border border-gray-700" style={{ backgroundColor: color }} />
                <span className="text-sm text-text-secondary">
                  {shade === "DEFAULT" ? "default" : shade}: {color}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Colors */}
        <div className="space-y-2">
          <h3 className="font-medium">Status</h3>
          <div className="space-y-1">
            {Object.entries(colors.status).map(([name, color]) => (
              <div key={name} className="flex items-center">
                <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: color }} />
                <span className="text-sm text-text-secondary">
                  {name}: {color}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Text Colors */}
        <div className="space-y-2">
          <h3 className="font-medium">Text</h3>
          <div className="space-y-1">
            {Object.entries(colors.text).map(([name, color]) => (
              <div key={name} className="flex items-center">
                <div className="w-6 h-6 rounded mr-2 border border-gray-700" style={{ backgroundColor: color }} />
                <span className="text-sm text-text-secondary">
                  {name}: {color}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-8">
        <h3 className="font-medium mb-4">Usage Examples</h3>

        <div className="space-y-4">
          {/* Tailwind Classes */}
          <div className="p-4 bg-background-100 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Tailwind Classes</h4>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-background-200 text-text-primary rounded-md hover:bg-background-100">
                Secondary Button
              </button>
              <span className="px-2 py-1 bg-status-success text-white rounded-full text-xs">Success</span>
              <span className="px-2 py-1 bg-status-error text-white rounded-full text-xs">Error</span>
            </div>
          </div>

          {/* Inline Styles */}
          <div className="p-4 bg-background-100 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Inline Styles</h4>
            <div className="flex flex-wrap gap-2">
              <button
                style={{
                  backgroundColor: colors.primary[600],
                  color: colors.text.primary,
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                }}
              >
                Primary Button
              </button>
              <div
                style={{
                  backgroundColor: colors.status.info,
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                }}
              >
                Info Box
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
