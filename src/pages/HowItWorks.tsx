import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, List, ChevronRight, Sparkles, ArrowRight, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo"; // Importando Logo

const steps = [
  {
    icon: Users,
    title: "1. Organize Ministérios e Membros",
    description: "Cadastre todos os seus ministérios (Louvor, Recepção, etc.) e adicione os membros com suas funções e e-mails. Marque as datas em que eles não podem servir.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    link: "/membros",
    linkText: "Ir para Membros",
  },
  {
    icon: Calendar,
    title: "2. Crie e Atribua Escalas",
    description: "Selecione o ministério, a data e o horário. Atribua os membros necessários para o serviço. O sistema ajuda a identificar conflitos de disponibilidade.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    link: "/escalas/nova",
    linkText: "Criar Escala",
  },
  {
    icon: Mail,
    title: "3. Compartilhe e Mantenha Informado",
    description: "Compartilhe o link público da escala ou use a função de envio de e-mail (futuro) para notificar automaticamente os membros escalados sobre seus compromissos.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    link: "/escalas",
    linkText: "Ver Escalas",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <header className="container mx-auto max-w-7xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <Logo size="md" />
        </div>
        <Link to="/auth">
          <Button variant="outline">
            Entrar
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </header>

      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <Clock className="w-4 h-4" />
            <span>Fluxo de Trabalho Simples</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Como o Escala Ministerial Organiza Sua Igreja
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Em apenas 3 passos, você transforma a maneira como gerencia seus ministérios e escalas.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative grid md:grid-cols-3 gap-10">
          {/* Vertical Line Connector (Desktop Only) */}
          <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-border/50 z-0">
            <div className="absolute left-[16.66%] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
            <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
            <div className="absolute right-[16.66%] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index} 
                className={cn(
                  "relative p-6 pt-12 border-border/50 shadow-xl bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]",
                  index > 0 && "mt-8 md:mt-0" // Espaçamento para mobile
                )}
              >
                {/* Step Number Badge */}
                <div className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg text-white shadow-lg",
                  step.bg.replace('/10', '/80')
                )}>
                  {index + 1}
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", step.bg)}>
                    <Icon className={cn("w-8 h-8", step.color)} />
                  </div>
                  <h2 className="text-xl font-bold mb-3">{step.title}</h2>
                  <p className="text-muted-foreground mb-6">{step.description}</p>
                  
                  <Link to={step.link} className="mt-auto">
                    <Button variant="link" className={cn("p-0", step.color)}>
                      {step.linkText}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Comece a Organizar Hoje</h2>
          <p className="text-lg text-muted-foreground mb-8">
            O Escala Ministerial é gratuito para começar. Não perca mais tempo com planilhas!
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-10 h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl hover:shadow-primary/25 transition-all hover:scale-105">
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Minha Conta Grátis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
