import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Header */}
      <header className="container mx-auto max-w-7xl flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Início
          </Button>
        </Link>
      </header>

      <div className="container mx-auto max-w-4xl">
        <Card className="p-8 md:p-12 shadow-2xl border-border/50">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: 20 de Julho de 2024
          </p>

          <div className="space-y-6 text-foreground/90 prose prose-sm sm:prose lg:prose-lg max-w-none">
            
            <h2>1. Introdução</h2>
            <p>
              A Escala Ministerial está profundamente comprometida em proteger a sua privacidade, usuário. Esta Política de Privacidade descreve de forma direta como coletamos, usamos, processamos e compartilhamos suas informações pessoais ao utilizar nosso software de gestão de escalas ministeriais.
            </p>

            <h2>2. Informações que Coletamos</h2>
            <p>
              Coletamos informações para fornecer e melhorar nossos serviços. As categorias de dados coletados incluem:
            </p>
            <ul>
              <li>
                <strong>Dados de Cadastro:</strong> Nome completo, endereço de e-mail e senha (criptografada) para criação de conta.
              </li>
              <li>
                <strong>Dados da Igreja:</strong> Nome da igreja, e-mail de contato, endereço e plano de assinatura.
              </li>
              <li>
                <strong>Dados Ministeriais:</strong> Nomes, funções e e-mails dos membros cadastrados pela igreja para fins de escala.
              </li>
              <li>
                <strong>Dados de Uso:</strong> Informações sobre como você interage com a plataforma, como páginas visitadas e recursos utilizados.
              </li>
            </ul>

            <h2>3. Uso das Informações</h2>
            <p>
              Utilizamos as informações coletadas para os seguintes propósitos:
            </p>
            <ul>
              <li>Gerenciar sua conta e fornecer os serviços da plataforma.</li>
              <li>Criar e gerenciar escalas ministeriais e a disponibilidade dos membros.</li>
              <li>Enviar notificações de escala e comunicações relacionadas ao serviço.</li>
              <li>Melhorar e personalizar a experiência do usuário.</li>
              <li>Processar pagamentos de assinaturas.</li>
            </ul>

            <h2>4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos ou alugamos suas informações pessoais. Compartilhamos dados apenas nas seguintes circunstâncias:
            </p>
            <ul>
              <li>
                <strong>Com a Igreja:</strong> Os dados dos membros (nome, função, e-mail) são visíveis apenas para os administradores e líderes ministeriais da igreja que os cadastrou.
              </li>
              <li>
                <strong>Provedores de Serviço:</strong> Utilizamos terceiros (como Supabase para banco de dados e Mercado Pago para pagamentos) que processam dados em nosso nome, sob rigorosos acordos de confidencialidade.
              </li>
              <li>
                <strong>Obrigações Legais:</strong> Se exigido por lei ou ordem judicial.
              </li>
            </ul>

            <h2>5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Todos os dados de autenticação são gerenciados pelo Supabase, garantindo padrões de segurança robustos.
            </p>

            <h2>6. Seus Direitos</h2>
            <p>
              Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de suas informações pessoais. Para exercer esses direitos, entre em contato conosco ou utilize as ferramentas disponíveis nas configurações da sua conta.
            </p>

            <h2>7. Alterações a Esta Política</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova Política de Privacidade nesta página.
            </p>

            <h2>8. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através do e-mail: escalaminsiterial@gmail.com.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
