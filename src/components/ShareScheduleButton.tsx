import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ShareScheduleButtonProps {
  scheduleId: string;
  scheduleTitle: string;
}

const ShareScheduleButton = ({ scheduleId, scheduleTitle }: ShareScheduleButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gera o link público
  const publicLink = `${window.location.origin}/schedule/${scheduleId}`;
  
  // Mensagem formatada para o WhatsApp com emojis e quebras de linha
  const whatsappMessage = encodeURIComponent(
    `*🙏 Escala Ministerial: ${scheduleTitle} 🙏*\n\n` +
    `🗓️ Olá! Sua escala de serviço está disponível no link:\n` +
    `${publicLink}\n\n` +
    `Confira os detalhes e horários! Deus abençoe seu serviço! ✨`
  );

  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsapp = () => {
    window.open(whatsappLink, '_blank');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Compartilhar
      </Button>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Compartilhar Escala</DialogTitle>
          <DialogDescription>
            Use o link abaixo para compartilhar esta escala publicamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Input 
            id="link" 
            defaultValue={publicLink} 
            readOnly 
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleCopy}
            variant={copied ? "default" : "secondary"}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button 
            type="button" 
            onClick={handleWhatsapp}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Compartilhar no WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareScheduleButton;
