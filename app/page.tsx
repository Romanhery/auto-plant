import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight, Droplets, Thermometer, Sun, Wind } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">SmartPlant</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6 animate-fade-in">
            <Leaf className="w-4 h-4" />
            Smart Hydroponic Monitoring
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6 animate-slide-up">
            Grow Smarter with
            <span className="text-primary block mt-2">Real-Time Plant Insights</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Monitor your hydroponic systems effortlessly. Track moisture, temperature, humidity, and light levels — all from one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Monitoring
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            Everything Your Plants Need
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Comprehensive monitoring for optimal plant growth
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Droplets className="w-6 h-6" />}
              title="Moisture"
              description="Track soil moisture levels in real-time"
              color="moisture"
            />
            <FeatureCard
              icon={<Thermometer className="w-6 h-6" />}
              title="Temperature"
              description="Monitor ambient temperature 24/7"
              color="temperature"
            />
            <FeatureCard
              icon={<Wind className="w-6 h-6" />}
              title="Humidity"
              description="Keep humidity in the perfect range"
              color="humidity"
            />
            <FeatureCard
              icon={<Sun className="w-6 h-6" />}
              title="Light"
              description="Ensure optimal light exposure"
              color="light"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Ready to Grow?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of growers using SmartPlant for healthier harvests.
          </p>
          <Link href="/signup">
            <Button size="lg">Create Free Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">SmartPlant</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SmartPlant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "moisture" | "temperature" | "humidity" | "light";
}

const FeatureCard = ({ icon, title, description, color }: FeatureCardProps) => {
  const colorClasses = {
    moisture: "bg-moisture/10 text-moisture",
    temperature: "bg-temperature/10 text-temperature",
    humidity: "bg-humidity/10 text-humidity",
    light: "bg-light/10 text-light",
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-glow group">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};

export default Index;
