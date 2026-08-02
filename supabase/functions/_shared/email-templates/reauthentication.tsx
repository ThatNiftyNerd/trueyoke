/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import {
  LOGO_URL,
  TAGLINE,
  card,
  code,
  container,
  footer,
  h1,
  hr,
  logo,
  main,
  tagline,
  text,
} from './brand.ts'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your TrueYoke verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="72" height="72" alt="TrueYoke" style={logo} />
        <Text style={tagline}>{TAGLINE}</Text>
        <Section style={card}>
          <Heading style={h1}>Confirm it&apos;s you</Heading>
          <Text style={text}>Enter this code to confirm your identity:</Text>
          <Text style={code}>{token}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          This code expires shortly. If you didn&apos;t request it, you can safely ignore
          this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
