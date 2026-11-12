"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCredentialByType } from "@/features/credentials/hooks/use-credential";
import { CredentialType } from "@/generated/prisma/enums";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and can contain only letters, numbers and underscores",
    }),
  credentialId: z.string().min(1, "WhatsApp credential is required"),
  phoneNumberId: z.string().min(1, "Phone Number ID is required"),
  to: z.string().min(1, "Recipient is required"),
  content: z.string().min(1, "Message content is required"),
});

export type WhatsAppFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WhatsAppFormValues) => void;
  defaultValues?: Partial<WhatsAppFormValues>;
}

export const WhatsAppDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentialByType(CredentialType.WHATSAPP);

  const { variableName, credentialId, phoneNumberId, to, content } =
    defaultValues;

  const form = useForm<WhatsAppFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: variableName ?? "whatsappReply",
      credentialId: credentialId ?? "",
      phoneNumberId: phoneNumberId ?? "",
      to: to ?? "{{chatId}}",
      content: content ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: variableName ?? "whatsappReply",
        credentialId: credentialId ?? "",
        phoneNumberId: phoneNumberId ?? "",
        to: to ?? "{{chatId}}",
        content: content ?? "",
      });
    }
  }, [open, variableName, credentialId, phoneNumberId, to, content, form]);

  const watchVariableName = form.watch("variableName") || "whatsappReply";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>WhatsApp Message</DialogTitle>
          <DialogDescription>
            Send a WhatsApp Cloud API text message. After a WhatsApp trigger,{" "}
            {"{{chatId}}"} is the sender to reply to.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values);
              onOpenChange(false);
            })}
            className="space-y-6 mt-2"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="whatsappReply" />
                  </FormControl>
                  <FormDescription>
                    Reference the result as {`{{${watchVariableName}.sent}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Credential</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingCredentials || !credentials?.length}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a WhatsApp access token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {credentials?.map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              src="/logos/whatsapp.svg"
                              alt="WhatsApp"
                              width={16}
                              height={16}
                            />
                            {credential.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Permanent Cloud API access token from the Meta Developer
                    Dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123456789012345" />
                  </FormControl>
                  <FormDescription>
                    From WhatsApp &gt; API Setup in the Meta dashboard (not the
                    phone number itself).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="{{chatId}}" />
                  </FormControl>
                  <FormDescription>
                    International number, or {"{{chatId}}"} to reply to the
                    incoming sender.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hi {{contactName}}, you said: {{text}}"
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
