import { AI, Clipboard, showHUD, showToast, Toast, environment } from "@raycast/api";

export default async function command() {
    if (!environment.canAccess(AI)) {
        await showHUD("You don't have access to Raycast AI :(");
        return;
    }

    try {
        const answer = await AI.ask("Suggest 5 jazz songs");
        await Clipboard.copy(answer);
        await showHUD("Copied AI response to clipboard!");
    } catch (error: any) {
        if (error.message?.includes("Model is not supported")) {
            await showToast({
                style: Toast.Style.Failure,
                title: "AI Not Available on Windows",
                message: "Raycast AI is not yet supported on Windows. Try macOS or use an external AI API.",
            });
        } else {
            await showToast({
                style: Toast.Style.Failure,
                title: "Failed to generate answer",
                message: String(error),
            });
        }
    }
}
