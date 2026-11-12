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
  credentialId: z.string().min(1, "Telegram credential is required"),
  chatId: z.string().min(1, "Chat ID is required"),
  content: z.string().min(1, "Message content is required"),
});

export type TelegramSendFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TelegramSendFormValues) => void;
  defaultValues?: Partial<TelegramSendFormValues>;
}

export const TelegramSendDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentialByType(CredentialType.TELEGRAM);

  const { variableName, credentialId, chatId, content } = defaultValues;

  const form = useForm<TelegramSendFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: variableName ?? "telegramReply",
      credentialId: credentialId ?? "",
      chatId: chatId ?? "{{chatId}}",
      content: content ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: variableName ?? "telegramReply",
        credentialId: credentialId ?? "",
        chatId: chatId ?? "{{chatId}}",
        content: content ?? "",
      });
    }
  }, [open, variableName, credentialId, chatId, content, form]);

  const watchVariableName = form.watch("variableName") || "telegramReply";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Telegram Message</DialogTitle>
          <DialogDescription>
            Send a Telegram message. After a Telegram trigger, use{" "}
            {"{{chatId}}"} and {"{{text}}"} to reply to the incoming chat.
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
                    <Input {...field} placeholder="telegramReply" />
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
                  <FormLabel>Telegram Credential</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingCredentials || !credentials?.length}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a Telegram bot token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {credentials?.map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              src="/logos/telegram.svg"
                              alt="Telegram"
                              width={16}
                              height={16}
                            />
                            {credential.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="{{chatId}}" />
                  </FormControl>
                  <FormDescription>
                    Incoming Telegram messages expose this as {"{{chatId}}"}.
                    You can also paste a numeric chat ID.
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
                      placeholder="You said: {{text}}"
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {"{{text}}"} for the incoming message or{" "}
                    {"{{gemini.text}}"} for generated replies.
                  </FormDescription>
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
