// no react import needed with jsx: react-jsx

type Props = {
  missing: string[]
}

export default function MissingConfig({ missing }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 p-6">
      <div className="max-w-xl w-full bg-white shadow rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-semibold mb-2">Configuration required</h1>
        <p className="mb-4">The app can’t start because some environment variables are missing:</p>
        <ul className="list-disc list-inside mb-4 text-red-700">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            On Vercel, add these in Project Settings → Environment Variables, then redeploy. Variables must start with
            <code className="px-1"> VITE_</code> to be available in the client at build time.
          </p>
          <p className="mt-2">
            Minimum required:
            <code className="px-1">VITE_CLERK_PUBLISHABLE_KEY</code>
            or
            <code className="px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>
          </p>
          <p>Recommended:
            <code className="px-1">VITE_API_URL</code> and optional <code className="px-1">VITE_SOCKET_URL</code>
          </p>
        </div>
      </div>
    </div>
  )
}
