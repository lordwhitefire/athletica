import BatchUploadForm from "./BatchUploadForm";

export default function BatchUploadPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-black uppercase tracking-tight">Batch Upload Products</h1>
                <p className="text-zinc-400 text-sm mt-1">
                    Upload a ZIP file containing a CSV and product images to create multiple products at once.
                    <br />
                    <span className="text-zinc-500">Max ZIP file size: 50MB.</span>
                </p>
            </div>
            <BatchUploadForm />
        </div>
    );
}
