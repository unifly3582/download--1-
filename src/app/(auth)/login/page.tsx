'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Image from 'next/image';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { LoaderCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-background');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    console.log('🔐 Attempting login with email:', values.email);
    
    try {
      console.log('🔐 Calling signInWithEmailAndPassword...');
      await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log('✅ Login successful, redirecting...');
      router.push('/');
    } catch (error: any) {
        console.error('❌ Login error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'auth/user-not-found') {
            try {
                console.log('👤 User not found, creating new account...');
                // createUserWithEmailAndPassword automatically signs in the user
                await createUserWithEmailAndPassword(auth, values.email, values.password);
                console.log('✅ Account created successfully, redirecting...');
                router.push('/');
            } catch (creationError: any) {
                console.error('❌ Account creation error:', creationError);
                toast({
                    variant: 'destructive',
                    title: 'Account Creation Failed',
                    description: creationError.message || 'Could not create user account. Please try again.',
                });
            }
        } else if (error.code === 'auth/network-request-failed') {
            toast({
                variant: 'destructive',
                title: 'Network Error',
                description: 'Firebase connection failed. Check your internet connection and Firebase configuration.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.message || 'Invalid email or password. Please try again.',
            });
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <Logo className="justify-center" />
            <h1 className="text-3xl font-bold font-headline mt-4">Welcome Back</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginImage && (
            <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            data-ai-hint={loginImage.imageHint}
            width="1920"
            height="1080"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
        )}
      </div>
    </div>
  );
}
