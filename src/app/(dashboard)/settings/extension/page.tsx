'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Linkedin, Download, Settings, CheckCircle2, AlertCircle, Code, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import NextLink from 'next/link'

export default function ExtensionInstallationPage() {
  const apiUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const userEmail = typeof window !== 'undefined' ? 'votre-email@exemple.com' : ''

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Installation de l&apos;extension Chrome</h1>
        <p className="text-muted-foreground">
          Guide complet pour installer et configurer l&apos;extension ORCHESTR
        </p>
      </div>

      {/* Quick Start */}
      <Alert>
        <Linkedin className="h-4 w-4" />
        <AlertDescription>
          L&apos;extension Chrome est la méthode recommandée pour capturer les profils LinkedIn.
          Elle est <strong>100% gratuite</strong> et ne nécessite aucune connexion OAuth.
        </AlertDescription>
      </Alert>

      {/* Step 1: Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Étape 1 : Télécharger l&apos;extension
          </CardTitle>
          <CardDescription>
            Récupérez les fichiers de l&apos;extension depuis le dépôt GitHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Option 1 : Via Git (recommandé)</p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <code>git clone https://github.com/clement-sporrer/orchestr.git</code>
              <br />
              <code>cd orchestr/chrome-extension</code>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Option 2 : Téléchargement direct</p>
            <p className="text-sm text-muted-foreground">
              Téléchargez le dossier <code className="bg-muted px-1 rounded">chrome-extension</code> depuis le dépôt GitHub
            </p>
            <NextLink href="https://github.com/clement-sporrer/orchestr" target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir le dépôt GitHub
              </Button>
            </NextLink>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Install */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Étape 2 : Installer dans Chrome
          </CardTitle>
          <CardDescription>
            Chargez l&apos;extension en mode développeur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4 list-decimal list-inside">
            <li>
              <div className="space-y-2">
                <p className="font-medium">Ouvrez Chrome et allez dans les extensions</p>
                <div className="bg-muted p-3 rounded-lg">
                  <code className="text-sm">chrome://extensions/</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ou via le menu : <strong>⋮</strong> → <strong>Extensions</strong> → <strong>Gérer les extensions</strong>
                </p>
              </div>
            </li>
            <li>
              <div className="space-y-2">
                <p className="font-medium">Activez le Mode développeur</p>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur le bouton <strong>&quot;Mode développeur&quot;</strong> en haut à droite
                </p>
              </div>
            </li>
            <li>
              <div className="space-y-2">
                <p className="font-medium">Chargez l&apos;extension</p>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur <strong>&quot;Charger l&apos;extension non empaquetée&quot;</strong> et sélectionnez le dossier <code className="bg-muted px-1 rounded">chrome-extension</code>
                </p>
              </div>
            </li>
            <li>
              <div className="space-y-2">
                <p className="font-medium">Vérification</p>
                <p className="text-sm text-muted-foreground">
                  L&apos;extension ORCHESTR devrait apparaître dans la liste avec une icône dans la barre d&apos;extensions
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 3: Configure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Étape 3 : Configurer l&apos;extension
          </CardTitle>
          <CardDescription>
            Configurez l&apos;URL de l&apos;API et votre clé d&apos;authentification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="font-medium mb-2">1. Ouvrez l&apos;extension</p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur l&apos;icône <strong>ORCHESTR</strong> dans la barre d&apos;extensions Chrome
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">2. URL de l&apos;API</p>
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-sm break-all">{apiUrl || 'https://votre-domaine.com'}</code>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ <strong>Important</strong> : N&apos;ajoutez PAS de slash final (<code>/</code>)
              </p>
              <div className="text-xs space-y-1">
                <p>✅ Correct : <code className="bg-muted px-1 rounded">https://orchestr.vercel.app</code></p>
                <p>❌ Incorrect : <code className="bg-muted px-1 rounded">https://orchestr.vercel.app/</code></p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">3. Clé API</p>
              <p className="text-sm text-muted-foreground">
                Entrez votre <strong>email de connexion ORCHESTR</strong>
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-sm">{userEmail}</code>
              </div>
              <p className="text-xs text-muted-foreground">
                C&apos;est l&apos;email que vous utilisez pour vous connecter à l&apos;application
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                4. Enregistrez
              </p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur <strong>&quot;Enregistrer&quot;</strong> pour sauvegarder vos paramètres
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisation</CardTitle>
          <CardDescription>
            Comment capturer un profil LinkedIn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 list-decimal list-inside">
            <li>
              <p className="font-medium">Naviguez vers un profil LinkedIn</p>
              <p className="text-sm text-muted-foreground">
                Ouvrez n&apos;importe quel profil (ex: <code className="bg-muted px-1 rounded">linkedin.com/in/nom-prenom</code>)
              </p>
            </li>
            <li>
              <p className="font-medium">Ouvrez l&apos;extension</p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur l&apos;icône ORCHESTR dans la barre d&apos;extensions
              </p>
            </li>
            <li>
              <p className="font-medium">Sélectionnez une mission (optionnel)</p>
              <p className="text-sm text-muted-foreground">
                Choisissez une mission dans la liste déroulante, ou laissez vide pour ajouter au vivier général
              </p>
            </li>
            <li>
              <p className="font-medium">Capturez le profil</p>
              <p className="text-sm text-muted-foreground">
                Cliquez sur <strong>&quot;Capturer ce profil&quot;</strong> et attendez la confirmation
              </p>
            </li>
          </ol>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">✨ Fonctionnalités :</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Extraction automatique : nom, expériences, formation, compétences</li>
              <li>Déduplication intelligente : les candidats existants sont mis à jour</li>
              <li>Scoring automatique : si ajouté à une mission, scoring par IA</li>
              <li>Ajout au vivier : sans mission, ajout au vivier global</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Dépannage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm">L&apos;extension ne s&apos;affiche pas</p>
              <p className="text-xs text-muted-foreground">
                Vérifiez que le Mode développeur est activé et que l&apos;extension est activée
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">&quot;Aucun profil détecté&quot;</p>
              <p className="text-xs text-muted-foreground">
                Assurez-vous d&apos;être sur une page de profil LinkedIn (<code>/in/nom-prenom</code>)
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">&quot;Erreur de connexion à l&apos;API&quot;</p>
              <p className="text-xs text-muted-foreground">
                Vérifiez l&apos;URL de l&apos;API (sans slash final) et que vous êtes connecté à ORCHESTR
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">&quot;Non autorisé&quot; (401)</p>
              <p className="text-xs text-muted-foreground">
                Vérifiez que votre email (clé API) correspond à votre compte ORCHESTR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Documentation complète</p>
              <p className="text-sm text-muted-foreground">
                Consultez le guide détaillé dans le fichier INSTALLATION.md
              </p>
            </div>
            <Badge variant="outline">chrome-extension/INSTALLATION.md</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

