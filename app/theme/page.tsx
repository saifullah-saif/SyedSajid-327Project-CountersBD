import ThemeExample from "@/components/theme-example"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function ThemePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-8">Theme System</h1>

        <div className="mb-8">
          <p className="text-text-secondary mb-4">
            This page demonstrates the modular color system used throughout the application. All colors are defined in a
            central location and can be easily updated to maintain consistency across the entire application.
          </p>

          <p className="text-text-secondary">
            Colors can be accessed via Tailwind classes (e.g.,{" "}
            <code className="bg-background-100 px-1 py-0.5 rounded">bg-primary-600</code>) or directly in
            JavaScript/TypeScript via the theme utilities.
          </p>
        </div>

        <ThemeExample />
      </main>

      <Footer />
    </div>
  )
}
