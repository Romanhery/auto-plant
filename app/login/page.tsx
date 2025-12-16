import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconInnerShadowTop, IconKey, IconMail, IconBrandGoogle } from "@tabler/icons-react"
import { login, signup, loginWithGoogle } from "./actions"

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="rounded-full bg-primary/10 p-3">
                            <IconInnerShadowTop className="size-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Smart Plant App</CardTitle>
                    <CardDescription>
                        Enter your email to sign in to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" name="email" type="email" placeholder="m@example.com" className="pl-9" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <IconKey className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="password" name="password" type="password" className="pl-9" required />
                                    </div>
                                </div>
                                <Button formAction={login} className="w-full">Sign In</Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="signup">
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <div className="relative">
                                        <IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="signup-email" name="email" type="email" placeholder="m@example.com" className="pl-9" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <div className="relative">
                                        <IconKey className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="signup-password" name="password" type="password" className="pl-9" required />
                                    </div>
                                </div>
                                <Button formAction={signup} className="w-full">Create Account</Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    <form action={loginWithGoogle}>
                        <Button variant="outline" className="w-full">
                            <IconBrandGoogle className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}