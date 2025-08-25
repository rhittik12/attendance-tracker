import { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'

type Props = PropsWithChildren<{
  publishableKey: string
}>

export default function ClerkWithRouter({ publishableKey, children }: Props) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  )
}
