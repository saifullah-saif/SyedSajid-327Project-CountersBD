import { Button } from "@/components/ui/button"

export default function CTASection() {
  return (
    <div className="bg-zinc-900 py-16 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Experience Amazing Events?</h2>
        <p className="text-zinc-300 max-w-2xl mx-auto mb-8">
          Join thousands of people who discover and attend events through our platform every day.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-red-600 hover:bg-red-700">
            Browse Events
          </Button>
          <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800">
            Become an Organizer
          </Button>
        </div>
      </div>
    </div>
  )
}
