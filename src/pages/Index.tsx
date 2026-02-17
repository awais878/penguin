import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Search, Users, Star, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user } = useAuth();

  const features = [
  { icon: Upload, title: "Share Resources", desc: "Upload notes, question papers, and study materials for your peers" },
  { icon: Search, title: "Discover Content", desc: "Find the best resources filtered by subject, semester, and type" },
  { icon: Users, title: "Follow Contributors", desc: "Stay updated with uploads from top contributors" },
  { icon: Star, title: "Rate & Review", desc: "Help the community by rating and reviewing resources" },
  { icon: Zap, title: "Earn Points", desc: "Get rewarded for sharing quality content and helping others" }];


  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-14 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <BookOpen className="h-5 w-5" />
            UniShare
          </Link>
          <div className="flex items-center gap-3">
            {user ?
            <Button asChild size="sm">
                <Link to="/dashboard">Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button> :

            <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            }
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container px-4 md:px-8 py-24 md:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            The academic resource platform for universities
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            Upload notes, share question papers, discover study materials, and collaborate with students across campuses.
          </p>
          <div className="flex gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Start Sharing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/resources">Browse Resources</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-20">
        <div className="container px-4 md:px-8">
          <h2 className="text-2xl font-bold mb-12">Everything you need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) =>
            <div key={i} className="group">
                <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20 text-gray-700 bg-secondary-foreground opacity-100">
        <div className="container px-4 md:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-200">Ready to share knowledge?</h2>
          <p className="text-background/60 mb-8 max-w-md mx-auto">
            Join thousands of students sharing and discovering academic resources.
          </p>
          <Button size="lg" variant="outline" className="border-background/20 text-background hover:bg-background hover:text-foreground" asChild>
            <Link to="/auth">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 md:px-8 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            UniShare
          </div>
          <p>Built for students, by students</p>
        </div>
      </footer>
    </div>);

}