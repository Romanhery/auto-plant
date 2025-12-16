
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IconAlertTriangle } from "@tabler/icons-react"
import Link from "next/link"

export default async function ErrorPage(props: {
    searchParams: Promise<{ message?: string }>
}) {
    const searchParams = await props.searchParams
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
            <Card className="w-full max-w-sm shadow-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <IconAlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">Authentication Error</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    <p>{searchParams.message || "There was a problem signing you in. Please check your credentials and try again."}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild className="w-full">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}