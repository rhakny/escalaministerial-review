import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, User, Mail, Loader2, Trash, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { useMinistries } from "@/hooks/useMinistryData";
import { MemberWithMinistry, useUpdateMember, useDeleteMember } from "@/hooks/useMemberData";
import { TablesUpdate } from "@/integrations/supabase/types";
import { Calendar } from "@/components/ui/calendar";
import { useMemberAvailability, useToggleMemberAvailability } from "@/hooks/useAvailabilityData";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MemberSheetProps {
  member: MemberWithMinistry | null;
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  isBlocked: boolean; // NOVO
}

const MemberSheet = ({ member, isOpen, onClose, churchId, isBlocked }: MemberSheetProps) => {
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();
  const { data: ministries } = useMinistries(churchId);
  
  const { data: unavailabilityDates, isLoading: isLoadingAvailability } = useMemberAvailability(member?.id || null);
  const toggleAvailabilityMutation = useToggleMemberAvailability();

  const [formData, setFormData] = useState({
    name: member?.name || "",
    function: member?.function || "",
    ministry_id: member?.ministry_id || "",
    observations: member?.observations || "", // Usado para restrições/notas
    phone_number: member?.phone_number || "55", // NOVO CAMPO
    tags: "", // Simulação de tags
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        function: member.function || "",
        ministry_id: member.ministry_id,
        observations: member.observations || "",
        phone_number: member.phone_number || "55", // Inicializa com o valor do membro ou '55'
        tags: "", // Implementação futura de tags
      });
    }
  }, [member]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, ministry_id: value }));
  };

  const handleSaveProfile = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para salvar alterações.");
      return;
    }
    if (!member) return;

    // Apenas Nome e Ministério são obrigatórios
    if (!formData.name || !formData.ministry_id) {
      toast.error("Nome e Ministério são obrigatórios.");
      return;
    }
    
    // Limpeza do telefone: se for apenas '55' ou vazio, salva como null
    const cleanedPhone = formData.phone_number.replace(/\D/g, '');
    const finalPhoneNumber = cleanedPhone.length > 2 ? cleanedPhone : null;

    const updates: TablesUpdate<'members'> = {
      name: formData.name,
      function: formData.function,
      ministry_id: formData.ministry_id,
      observations: formData.observations,
      phone_number: finalPhoneNumber, // NOVO CAMPO
      // tags: formData.tags // Implementação futura
      // O email não é atualizado aqui
    };

    try {
      await updateMemberMutation.mutateAsync({ id: member.id, updates });
      onClose();
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleDeleteMember = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para excluir membros.");
      return;
    }
    if (!member) return;
    try {
      await deleteMemberMutation.mutateAsync(member.id);
      onClose();
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleDayClick = async (date: Date) => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para gerenciar disponibilidade.");
      return;
    }
    if (!member) return;
    const dateString = format(date, 'yyyy-MM-dd');
    
    const isUnavailable = unavailabilityDates?.some(d => isSameDay(parseISO(d.date), date));
    
    // Toggle availability
    await toggleAvailabilityMutation.mutateAsync({
      memberId: member.id,
      date: dateString,
      isAvailable: isUnavailable, // Se estava indisponível, estamos tornando disponível (true)
    });
  };

  const unavailableDays = useMemo(() => {
    return unavailabilityDates?.map(d => parseISO(d.date)) || [];
  }, [unavailabilityDates]);

  const isSaving = updateMemberMutation.isPending || toggleAvailabilityMutation.isPending;
  const isDeleting = deleteMemberMutation.isPending;
  const isActionDisabled = isSaving || isDeleting || isBlocked;

  if (!member) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Editar Membro: {member.name}</SheetTitle>
          <SheetDescription>
            Gerencie o perfil, habilidades e disponibilidade do membro.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" /> Perfil
            </TabsTrigger>
            <TabsTrigger value="availability">
              <CalendarIcon className="w-4 h-4 mr-2" /> Disponibilidade
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="profile" className="mt-0 space-y-4">
              {/* Perfil Completo */}
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={isActionDisabled} />
              </div>
              
              {/* E-mail (Apenas visualização, não editável) */}
              <div>
                <Label htmlFor="email">E-mail (Não Editável)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={member.email} 
                  disabled={true} 
                  className="cursor-not-allowed"
                />
              </div>
              
              {/* NOVO CAMPO: Telefone */}
              <div>
                <Label htmlFor="phone_number">Telefone (WhatsApp, Ex: 5511987654321)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="phone_number" 
                    name="phone_number" 
                    type="tel"
                    placeholder="55 (DDD) Número"
                    value={formData.phone_number} 
                    onChange={handleInputChange} 
                    disabled={isActionDisabled} 
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Inclua o código do país (55) e o DDD.</p>
              </div>
              
              <div>
                <Label htmlFor="ministry_id">Ministério *</Label>
                <Select onValueChange={handleSelectChange} value={formData.ministry_id} disabled={isActionDisabled}>
                  <SelectTrigger id="ministry_id">
                    <SelectValue placeholder="Selecione um ministério" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="function">Habilidade/Função (Ex: Vocalista, Tecladista)</Label>
                <Input id="function" name="function" value={formData.function} onChange={handleInputChange} disabled={isActionDisabled} />
              </div>
              <div>
                <Label htmlFor="observations">Restrições / Observações</Label>
                <Textarea id="observations" name="observations" value={formData.observations} onChange={handleInputChange} disabled={isActionDisabled} rows={3} />
              </div>
              {/* Tags/Categorias (Simulação) */}
              <div>
                <Label htmlFor="tags">Tags/Categorias (Ex: Líder, Backup)</Label>
                <Input id="tags" name="tags" placeholder="Separar por vírgula" value={formData.tags} onChange={handleInputChange} disabled={isActionDisabled} />
              </div>
              
              {isBlocked && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Acesso bloqueado. Faça um upgrade para editar.
                </div>
              )}

              <div className="flex justify-between gap-4 mt-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isActionDisabled}>
                      {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
                      Excluir Membro
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o membro{" "}
                        <span className="font-semibold">{member.name}</span> e todas as suas disponibilidades e atribuições de escala.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive hover:bg-destructive/90">
                        Excluir Membro
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button onClick={handleSaveProfile} className="flex-1" disabled={isActionDisabled}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Perfil
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="availability" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Marque as datas em que o membro **NÃO PODE** servir.
              </p>
              {isBlocked && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Acesso bloqueado. Faça um upgrade para gerenciar disponibilidade.
                </div>
              )}
              <Card className="p-4 flex justify-center">
                {isLoadingAvailability ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <Calendar
                    mode="multiple"
                    selected={unavailableDays}
                    onSelect={() => { /* No-op, handled by onDayClick */ }}
                    onDayClick={handleDayClick}
                    locale={ptBR}
                    className="w-full p-0"
                    modifiers={{ unavailable: unavailableDays }}
                    classNames={{
                      day_unavailable: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    }}
                    disabled={isActionDisabled}
                  />
                )}
              </Card>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 bg-destructive rounded-full" />
                Indisponível
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default MemberSheet;
