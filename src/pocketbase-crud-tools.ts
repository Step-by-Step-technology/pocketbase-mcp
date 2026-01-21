/**
 * MCP Server Tools - Gestion de Records PocketBase (CRUD)
 * Outils pour gérer les records (CRUD) via l'API REST de PocketBase
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Outil pour récupérer un record spécifique
 */
export function registerPocketbaseCrudTools(server: any) {
    server.registerTool(
        'pocketbase-fetch-record',
        {
            title: 'Récupérer un Record PocketBase',
            description: 'Récupère un record spécifique d\'une collection PocketBase',
            inputSchema: z.object({
                collectionName: z.string().describe('Nom de la collection'),
                recordId: z.string().describe('ID du record à récupérer')
            }),
            outputSchema: {
                record: z.any(),
                success: z.boolean(),
                collectionName: z.string(),
                recordId: z.string()
            }
        },
        async ({ collectionName, recordId }: { collectionName: string; recordId: string }) => {
            try {
                const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
                const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

                if (!adminToken) {
                    throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
                }

                const response = await fetch(`${pbUrl}/api/collections/${collectionName}/records/${recordId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': adminToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status} - ${await response.text()}`);
                }

                const record = await response.json();

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Record récupéré avec succès!\n\n📄 Collection: ${collectionName}\n🆔 ID: ${recordId}\n📊 Données:\n${JSON.stringify(record, null, 2)}`
                    }],
                    structuredContent: {
                        record,
                        success: true,
                        collectionName,
                        recordId
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Erreur: ${(error as Error).message}`
                    }],
                    isError: true
                };
            }
        }
    );

    /**
     * Outil pour lister les records d'une collection
     */
    server.registerTool(
        'pocketbase-list-records',
        {
            title: 'Lister les Records d\'une Collection',
            description: 'Liste tous les records d\'une collection PocketBase avec pagination',
            inputSchema: z.object({
                collectionName: z.string().describe('Nom de la collection'),
                page: z.number().optional().default(1).describe('Numéro de page (défaut: 1)'),
                perPage: z.number().optional().default(50).describe('Nombre de records par page (défaut: 50)'),
                filter: z.string().optional().describe('Filtre au format PocketBase (ex: "title~\'test\'")'),
                sort: z.string().optional().describe('Tri (ex: "-created" pour décroissant)')
            }),
            outputSchema: {
                records: z.array(z.any()),
                success: z.boolean(),
                collectionName: z.string(),
                page: z.number(),
                perPage: z.number(),
                totalItems: z.number(),
                totalPages: z.number()
            }
        },
        async ({ collectionName, page = 1, perPage = 50, filter, sort }: {
            collectionName: string;
            page?: number;
            perPage?: number;
            filter?: string;
            sort?: string;
        }) => {
            try {
                const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
                const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

                if (!adminToken) {
                    throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
                }

                // Construire l'URL avec les paramètres de query
                const url = new URL(`${pbUrl}/api/collections/${collectionName}/records`);
                url.searchParams.append('page', page.toString());
                url.searchParams.append('perPage', perPage.toString());
                if (filter) url.searchParams.append('filter', filter);
                if (sort) url.searchParams.append('sort', sort);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Authorization': adminToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status} - ${await response.text()}`);
                }

                const result = await response.json();

                return {
                    content: [{
                        type: 'text',
                        text: `✅ ${result.items.length} record(s) trouvé(s)!\n\n📄 Collection: ${collectionName}\n📊 Page: ${page}/${Math.ceil(result.totalItems / perPage)}\n📈 Total: ${result.totalItems} record(s)\n\n📋 Records:\n${JSON.stringify(result.items, null, 2)}`
                    }],
                    structuredContent: {
                        records: result.items,
                        success: true,
                        collectionName,
                        page,
                        perPage,
                        totalItems: result.totalItems,
                        totalPages: Math.ceil(result.totalItems / perPage)
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Erreur: ${(error as Error).message}`
                    }],
                    isError: true
                };
            }
        }
    );

    /**
     * Outil pour créer un nouveau record
     */
    server.registerTool(
        'pocketbase-create-record',
        {
            title: 'Créer un Record PocketBase',
            description: 'Crée un nouveau record dans une collection PocketBase',
            inputSchema: z.object({
                collectionName: z.string().describe('Nom de la collection'),
                data: z.record(z.any()).describe('Données du record à créer')
            }),
            outputSchema: {
                record: z.any(),
                success: z.boolean(),
                collectionName: z.string(),
                recordId: z.string()
            }
        },
        async ({ collectionName, data }: { collectionName: string; data: Record<string, any> }) => {
            try {
                const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
                const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

                if (!adminToken) {
                    throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
                }

                const response = await fetch(`${pbUrl}/api/collections/${collectionName}/records`, {
                    method: 'POST',
                    headers: {
                        'Authorization': adminToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status} - ${await response.text()}`);
                }

                const record = await response.json();

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Record créé avec succès!\n\n📄 Collection: ${collectionName}\n🆔 ID: ${record.id}\n📊 Données créées:\n${JSON.stringify(record, null, 2)}`
                    }],
                    structuredContent: {
                        record,
                        success: true,
                        collectionName,
                        recordId: record.id
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Erreur: ${(error as Error).message}`
                    }],
                    isError: true
                };
            }
        }
    );

    /**
     * Outil pour mettre à jour un record
     */
    server.registerTool(
        'pocketbase-update-record',
        {
            title: 'Mettre à Jour un Record PocketBase',
            description: 'Met à jour un record existant dans une collection PocketBase',
            inputSchema: z.object({
                collectionName: z.string().describe('Nom de la collection'),
                recordId: z.string().describe('ID du record à mettre à jour'),
                data: z.record(z.any()).describe('Données à mettre à jour')
            }),
            outputSchema: {
                record: z.any(),
                success: z.boolean(),
                collectionName: z.string(),
                recordId: z.string()
            }
        },
        async ({ collectionName, recordId, data }: { collectionName: string; recordId: string; data: Record<string, any> }) => {
            try {
                const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
                const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

                if (!adminToken) {
                    throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
                }

                const response = await fetch(`${pbUrl}/api/collections/${collectionName}/records/${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': adminToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status} - ${await response.text()}`);
                }

                const record = await response.json();

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Record mis à jour avec succès!\n\n📄 Collection: ${collectionName}\n🆔 ID: ${recordId}\n📊 Données mises à jour:\n${JSON.stringify(record, null, 2)}`
                    }],
                    structuredContent: {
                        record,
                        success: true,
                        collectionName,
                        recordId
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Erreur: ${(error as Error).message}`
                    }],
                    isError: true
                };
            }
        }
    );

    /**
     * Outil pour obtenir le schéma d'une collection (simplifié)
     */
    server.registerTool(
        'pocketbase-get-collection-schema',
        {
            title: 'Obtenir le Schéma d\'une Collection',
            description: 'Obtient le schéma (champs et types) d\'une collection PocketBase',
            inputSchema: z.object({
                collectionName: z.string().describe('Nom de la collection')
            }),
            outputSchema: {
                schema: z.object({
                    name: z.string(),
                    type: z.string(),
                    fields: z.array(z.object({
                        name: z.string(),
                        type: z.string(),
                        required: z.boolean(),
                        options: z.any().optional()
                    })),
                    created: z.string(),
                    updated: z.string()
                }),
                success: z.boolean(),
                collectionName: z.string()
            }
        },
        async ({ collectionName }: { collectionName: string }) => {
            try {
                const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
                const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

                if (!adminToken) {
                    throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
                }

                // D'abord, obtenir la liste des collections pour trouver l'ID
                const listResponse = await fetch(`${pbUrl}/api/collections`, {
                    method: 'GET',
                    headers: {
                        'Authorization': adminToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (!listResponse.ok) {
                    throw new Error(`Erreur API: ${listResponse.status}`);
                }

                const listResult = await listResponse.json();
                const collection = listResult.items.find((item: any) => item.name === collectionName);

                if (!collection) {
                    throw new Error(`Collection "${collectionName}" non trouvée`);
                }

                // Obtenir les détails complets de la collection
                const detailResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': adminToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (!detailResponse.ok) {
                    throw new Error(`Erreur API: ${detailResponse.status}`);
                }

                const collectionDetails = await detailResponse.json();

                // Extraire le schéma simplifié
                const schema = {
                    name: collectionDetails.name,
                    type: collectionDetails.type,
                    fields: collectionDetails.fields.map((field: any) => ({
                        name: field.name,
                        type: field.type,
                        required: field.required || false,
                        options: field.values || field.max || field.min ? {
                            values: field.values,
                            max: field.max,
                            min: field.min,
                            maxSelect: field.maxSelect
                        } : undefined
                    })),
                    created: collectionDetails.created,
                    updated: collectionDetails.updated
                };

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Schéma de collection obtenu avec succès!\n\n📄 Collection: ${collectionName}\n📋 Type: ${collectionDetails.type}\n📊 ${collectionDetails.fields.length} champ(s)\n\n📋 Schéma:\n${JSON.stringify(schema, null, 2)}`
                    }],
                    structuredContent: {
                        schema,
                        success: true,
                        collectionName
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Erreur: ${(error as Error).message}`
                    }],
                    isError: true
                };
            }
        }
    );

    /**
     * Outil pour uploader un fichier
     */
    server.registerTool(
        'pocketbase-upload-file',
        {
            title: 'Uploader un Fichier vers PocketBase',
            description: 'Upload un fichier vers une collection PocketBase',
            inputSchema: z.object({
                collectionName: z.string().describe('Nom de la collection'),
                recordId: z.string().describe('ID du record'),
                fieldName: z.string().describe('Nom du champ de type file'),
                filePath: z.string().describe('Chemin local du fichier à uploader')
            }),
            outputSchema: {
                success: z.boolean(),
                collectionName: z.string(),
                recordId: z.string(),
                fieldName: z.string(),
                fileUrl: z.string().optional()
            }
        },
        async ({ collectionName, recordId, fieldName, filePath }: {
            collectionName: string;
            recordId: string;
            fieldName: string;
            filePath: string;
        }) => {
            try {
                const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
                const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

                if (!adminToken) {
                    throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
                }

                // Lire le fichier
                const fileBuffer = fs.readFileSync(filePath);
                const fileName = path.basename(filePath);

                // Créer FormData pour l'upload
                const formData = new FormData();
                const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
                formData.append(fieldName, blob, fileName);

                const response = await fetch(`${pbUrl}/api/collections/${collectionName}/records/${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': adminToken
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status} - ${await response.text()}`);
                }

                const result = await response.json();

                // Extraire l'URL du fichier
                const fileUrl = result[fieldName] ? `${pbUrl}/api/files/${collectionName}/${recordId}/${result[fieldName]}` : undefined;

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Fichier uploadé avec succès!\n\n📄 Collection: ${collectionName}\n🆔 Record: ${recordId}\n📁 Champ: ${fieldName}\n📄 Fichier: ${fileName}\n🔗 URL: ${fileUrl || 'Non disponible'}`
                    }],
                    structuredContent: {
                        success: true,
                        collectionName,
                        recordId,
                        fieldName,
                        fileUrl
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Erreur: ${(error as Error).message}`
                    }],
                    isError: true
                };
            }
        }
    );

    /**
     * Outil pour télécharger un fichier
     */
    server.registerTool(
        'pocketbase-download-file',
        {
            title: 'Télécharger un Fichier depuis PocketBase',
            description: 'Télécharge un fichier depuis une collection PocketBase',
            inputSchema: z.object({
                collectionName: z.string().describe('Nom de la collection'),
                recordId: z.string().describe('ID du record'),
                fieldName: z.string().describe('Nom du champ de type file'),
                outputPath: z.string().optional().describe('Chemin local où sauvegarder le fichier (défaut: ./downloads/)')
            }),
            outputSchema: {
                success: z.boolean(),
                collectionName: z.string(),
                recordId: z.string(),
                fieldName: z.string(),
                filePath: z.string().optional(),
                fileSize: z.number().optional()
            }
        },
        async ({ collectionName, recordId, fieldName, outputPath }: {
            collectionName: string;
            recordId: string;
            fieldName: string;
            outputPath?: string;
        }) => {
            try {
                const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
                const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

                if (!adminToken) {
                    throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
                }

                // D'abord, obtenir le record pour connaître le nom du fichier
                const recordResponse = await fetch(`${pbUrl}/api/collections/${collectionName}/records/${recordId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': adminToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (!recordResponse.ok) {
                    throw new Error(`Erreur API: ${recordResponse.status} - ${await recordResponse.text()}`);
                }

                const record = await recordResponse.json();

                if (!record[fieldName]) {
                    throw new Error(`Le champ "${fieldName}" ne contient pas de fichier`);
                }

                const fileName = record[fieldName];
                const fileUrl = `${pbUrl}/api/files/${collectionName}/${recordId}/${fileName}`;

                // Télécharger le fichier
                const fileResponse = await fetch(fileUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': adminToken
                    }
                });

                if (!fileResponse.ok) {
                    throw new Error(`Erreur de téléchargement: ${fileResponse.status} - ${await fileResponse.text()}`);
                }

                // Créer le répertoire de téléchargement si nécessaire
                const downloadDir = outputPath ? path.dirname(outputPath) : './downloads';
                if (!fs.existsSync(downloadDir)) {
                    fs.mkdirSync(downloadDir, { recursive: true });
                }

                // Déterminer le chemin de sortie
                const finalOutputPath = outputPath || path.join(downloadDir, fileName);

                // Convertir la réponse en buffer et sauvegarder
                const fileBuffer = await fileResponse.arrayBuffer();
                fs.writeFileSync(finalOutputPath, Buffer.from(fileBuffer));

                const fileStats = fs.statSync(finalOutputPath);

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Fichier téléchargé avec succès!\n\n📄 Collection: ${collectionName}\n🆔 Record: ${recordId}\n📁 Champ: ${fieldName}\n📄 Fichier: ${fileName}\n💾 Taille: ${(fileStats.size / 1024).toFixed(2)} KB\n📁 Sauvegardé: ${finalOutputPath}`
                    }],
                    structuredContent: {
                        success: true,
                        collectionName,
                        recordId,
                        fieldName,
                        filePath: finalOutputPath,
                        fileSize: fileStats.size
                    }
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Erreur: ${(error as Error).message}`
                    }],
                    isError: true
                };
            }
        }
    );
}
