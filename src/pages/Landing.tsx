import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronRight, Clock, MessageSquare, Shield, Smartphone, Users, Zap, Play, AlertCircle, HelpCircle, Heart } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Landing = () => {
  const { user, loading } = useAuth();
  const whatsappLink = "https://wa.me/556993834215?text=Ol%C3%A1%2C%20gostaria%20de%20entender%20como%20funciona%20a%20automa%C3%A7%C3%A3o%20de%20escalas%20para%20minha%20igreja.";

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  // Se o usuário estiver logado, redireciona para o dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-secondary selection:text-secondary-foreground">

      {/* Botão Flutuante WhatsApp */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 animate-bounce hover:animate-none transition-all duration-300 hover:scale-110"
      >
        <div className="bg-[#25D366] p-4 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#20bd5a] ring-2 ring-white/50">
          <MessageSquare className="w-8 h-8 fill-current" />
        </div>
      </a>

      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex gap-4 items-center">
            <Link to="/auth">
              <Button variant="ghost" className="font-medium hover:text-primary">Já sou cliente</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shadow-lg shadow-secondary/20">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-6xl text-center relative z-10">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-semibold mb-8 animate-fade-in-up">
            <Zap className="w-4 h-4" />
            <span>A ferramenta definitiva para líderes ministeriais</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            O fim do caos nas <br className="hidden md:block" />
            <span className="text-primary relative inline-block">
              escalas da sua igreja.
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary opacity-60" viewBox="0 0 200 9" fill="none"><path d="M2.00028 7.22874C2.00028 7.22874 53.6706 0.963471 99.4344 1.25925C148.887 1.5788 197.669 4.39714 197.669 4.39714" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Automatize a confirmação de voluntários via WhatsApp com 48h de antecedência.
            Saiba quem vai ao culto antes mesmo dele começar e acabe com os "buracos" na escala de última hora.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-14 px-8 text-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-xl shadow-green-600/20 w-full sm:w-auto">
                <MessageSquare className="w-5 h-5 mr-2" />
                Falar com Consultor
              </Button>
            </a>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 w-full sm:w-auto hover:bg-primary/5 hover:border-primary/30">
                Começar 15 Dias Grátis
              </Button>
            </Link>
          </div>

          {/* Vídeo Demo Frame - Vertical (Mobile Style) */}
          <div className="relative max-w-[320px] mx-auto rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-slate-800 bg-slate-800 group transition-transform hover:scale-[1.02] duration-500">
            {/* Notch simulation */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />

            <div className="aspect-[9/16] relative bg-black flex items-center justify-center">
              <video
                className="w-full h-full object-cover"
                poster="/logo.png"
                controls
                muted
                autoPlay
                loop
                playsInline
              >
                <source src="/demo-video.mp4" type="video/mp4" />
                Seu navegador não suporta a tag de vídeo.
              </video>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 italic">Assista como é fácil organizar sua equipe em menos de 2 minutos.</p>
        </div>
      </section>

      {/* Seção O que Resolvemos (Dores) */}
      <section className="py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Por que líderes amam o Escala Ministerial?</h2>
            <p className="text-lg text-muted-foreground">Focamos em resolver os três maiores pesadelos da gestão de voluntários.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-background border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <CardTitle className="text-xl">Redução de Faltas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Esqueça os voluntários que dizem "esqueci que era hoje". O sistema lembra eles automaticamente e cobra confirmação.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Economia de Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pare de gastar horas no WhatsApp cobrando respostas. O robô faz o trabalho chato por você enquanto você cuida das pessoas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-secondary" />
                </div>
                <CardTitle className="text-xl">Organização Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Todas as escalas, indisponibilidades e contatos em um só lugar. Nada de planilhas perdidas ou anotações em papel.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-24 px-4 bg-background relative overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Tão simples que parece mágica</h2>
            <p className="text-lg text-muted-foreground">Em três passos sua igreja entra no piloto automático.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Linha conectora desktop */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-border z-0" />

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-background border-4 border-primary text-primary flex items-center justify-center text-3xl font-bold mb-6 shadow-xl group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Crie a Escala</h3>
              <p className="text-muted-foreground px-4">Monte a escala do mês em minutos usando nossos templates inteligentes.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-background border-4 border-secondary text-secondary flex items-center justify-center text-3xl font-bold mb-6 shadow-xl group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Conecte o WhatsApp</h3>
              <p className="text-muted-foreground px-4">Escaneie o QR Code com o número da igreja para garantir segurança e identidade.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-background border-4 border-green-500 text-green-500 flex items-center justify-center text-3xl font-bold mb-6 shadow-xl group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Relaxe e Lidere</h3>
              <p className="text-muted-foreground px-4">O sistema cuida das mensagens. Você terá 15 dias para testar tudo sem pagar nada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela de Preços */}
      <section id="precos" className="py-24 px-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Investimento que se paga no primeiro culto</h2>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm bg-orange-100 text-orange-800 py-2 px-6 rounded-full inline-flex border border-orange-200 font-bold animate-pulse">
              <Zap className="w-4 h-4" />
              <span>Experimente TODOS os recursos GRÁTIS por 15 dias!</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
              <Smartphone className="w-4 h-4" />
              <span>Conexão via QR Code obrigatória para segurança da conta (Planos Pagos)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 items-start">

            {/* Plano Trial (DESTAQUE PARA NOVO USUÁRIO) */}
            <Card className="border-2 border-dashed border-primary shadow-xl relative bg-primary/5 hover:bg-primary/10 transition-colors">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                EXPERIMENTE GRÁTIS
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">Teste Gratuito</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-foreground">R$ 0</span>
                  <span className="text-muted-foreground">/15 dias</span>
                </div>
                <CardDescription className="mt-2 text-xs">Acesso total a todos os recursos para você conhecer o sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2 font-bold text-primary"><Check className="w-4 h-4" /> Recursos VIP Liberados</li>
                  <li className="flex items-center gap-2 font-bold text-primary"><Check className="w-4 h-4" /> Até 30 membros</li>
                  <li className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /> Sem automação WhatsApp</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Suporte Prime</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/auth" className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10">Criar Conta Grátis</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Plano Semente */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow relative top-4">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-600">Semente</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-foreground">R$ 29</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <CardDescription className="mt-2">Para igrejas que estão começando a organização.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Até 30 membros</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Escalas Ilimitadas</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Painel do Voluntário</li>
                  <li className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /> Sem automação de WhatsApp</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/auth" className="w-full">
                  <Button variant="outline" className="w-full">Começar Semente</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Plano Crescimento (DESTAQUE) */}
            <Card className="border-2 border-secondary shadow-2xl relative bg-background transform md:-translate-y-4 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-secondary to-primary text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                MAIS VENDIDO
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-secondary">Crescimento</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-extrabold text-primary">R$ 89</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <CardDescription className="mt-2 font-medium text-foreground/80">O poder da automação para sua igreja.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex items-center gap-2"><Check className="w-5 h-5 text-secondary" /> <strong>Até 80 membros</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-5 h-5 text-secondary" /> <strong>Automação WhatsApp (n8n)</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-5 h-5 text-secondary" /> Confirmação auto. 48h antes</li>
                  <li className="flex items-center gap-2"><Check className="w-5 h-5 text-secondary" /> Escalas Ilimitadas</li>
                  <li className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex gap-2 items-start mt-2">
                    <Smartphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    Requer conexão de número próprio via QR Code.
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold h-12 shadow-lg shadow-secondary/20">
                    Contratar Crescimento
                  </Button>
                </a>
              </CardFooter>
            </Card>

            {/* Plano Reino */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow relative top-4">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-800">Reino</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-foreground">R$ 149</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <CardDescription className="mt-2">Gestão total e suporte VIP.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Membros Ilimitados</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> <strong>Tudo do Crescimento</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Suporte Prioritário (WhatsApp)</li>
                </ul>
              </CardContent>
              <CardFooter>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">Contratar Reino</Button>
                </a>
              </CardFooter>
            </Card>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Dúvidas Frequentes</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">Por que preciso conectar o número da igreja?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Esta é uma medida de segurança e credibilidade. Quando os membros recebem a mensagem do número oficial da igreja (e não de um número desconhecido), a taxa de resposta é muito maior e evita que a mensagem seja marcada como SPAM. Além disso, mantém a identidade da sua congregação.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">O sistema envia mensagem em grupo?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Não. O sistema envia mensagens individuais e personalizadas para cada voluntário. Isso garante que a pessoa se sinta pessoalmente responsável pela sua escala, aumentando o compromisso.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">Posso testar antes de assinar?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Sim! Ao se cadastrar, você ganha 15 dias de acesso gratuito para testar a plataforma de gestão de escalas. O período de teste inclui até 30 membros e escalas ilimitadas, mas não inclui a automação de WhatsApp. Para testar a automação completa, você pode contratar o plano Crescimento ou Reino.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
            </div>

            <div className="text-center md:text-right space-y-2">
              <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                Política de Privacidade
              </Link>
              <p className="text-muted-foreground text-sm">
                Desenvolvido por Rhakny Araujo
              </p>
              <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-end text-sm">
                Contato: <a href="mailto:escalaminsisterial@gmail.com" className="text-primary hover:underline">escalaminsisterial@gmail.com</a>
              </p>
              <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-end text-xs">
                © 2025 Escala Ministerial. Feito com <Heart className="w-4 h-4 fill-primary text-primary" /> para servir as igrejas.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
