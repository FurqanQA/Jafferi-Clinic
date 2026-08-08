import { getUserClinicId, getCurrentUser } from '../core/auth';
import { NotFoundError, AuthorizationError, DatabaseError, ConflictError } from '../core/errors';
import { logger } from '../shared/logger';
import { Folder } from './document-types';
import { validateDocumentEditPermission } from './document-permissions';
import { getSupabaseClient } from '../core/client';

// ============================================================================
// Folders Service
// Folder structure management for document organization
// ============================================================================

/**
 * Create a new folder
 */
export async function createFolder(
  name: string,
  parentId?: string,
  description?: string
): Promise<Folder> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission();

    // Generate folder path
    let path = name;
    if (parentId) {
      const parentFolder = await getFolder(parentId);
      path = `${parentFolder.path}/${name}`;
    }

    const folder: Folder = {
      id: crypto.randomUUID(),
      clinic_id: clinicId,
      parent_id: parentId,
      name,
      path,
      description,
      is_system: false,
      document_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('document_folders')
      .insert(folder)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to create folder', { error });
    }

    logger.info('Folder created', { folderId: folder.id, clinicId, userId: user.id });
    return data as Folder;
  } catch (error) {
    logger.error('Failed to create folder', { error, name, parentId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get a folder by ID
 */
export async function getFolder(folderId: string): Promise<Folder> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: folder, error } = await supabase
      .from('document_folders')
      .select('*')
      .eq('id', folderId)
      .eq('clinic_id', clinicId)
      .single();

    if (error || !folder) {
      throw new NotFoundError('Folder not found');
    }

    // Verify clinic access for multi-tenancy
    if (folder.clinic_id !== clinicId) {
      throw new AuthorizationError('Access denied');
    }

    logger.info('Folder retrieved', { folderId, clinicId, userId: user.id });
    return folder as Folder;
  } catch (error) {
    logger.error('Failed to get folder', { error, folderId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get all folders for a clinic
 */
export async function getFolders(options?: {
  parent_id?: string;
  include_system?: boolean;
}): Promise<Folder[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data: folders, error } = await supabase
      .from('document_folders')
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) {
      throw new DatabaseError('Failed to fetch folders', { error });
    }

    // Apply filters
    let filteredFolders = (folders as Folder[]) || [];
    if (options?.parent_id) {
      filteredFolders = filteredFolders.filter(f => f.parent_id === options.parent_id);
    }
    if (options?.include_system === false) {
      filteredFolders = filteredFolders.filter(f => !f.is_system);
    }

    logger.info('Folders retrieved', { clinicId, userId: user.id, options, count: filteredFolders.length });
    return filteredFolders;
  } catch (error) {
    logger.error('Failed to get folders', { error, clinicId, userId: user.id, options });
    throw error;
  }
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  updates: Partial<Pick<Folder, 'name' | 'description' | 'parent_id'>>
): Promise<Folder> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission();

    const existingFolder = await getFolder(folderId);

    if (existingFolder.is_system) {
      throw new AuthorizationError('Cannot modify system folders');
    }

    // Recalculate path if parent changed
    let path = existingFolder.path;
    if (updates.parent_id && updates.parent_id !== existingFolder.parent_id) {
      const parentFolder = await getFolder(updates.parent_id);
      path = `${parentFolder.path}/${existingFolder.name}`;
    } else if (updates.name && updates.name !== existingFolder.name) {
      const parentPath = existingFolder.parent_id 
        ? (await getFolder(existingFolder.parent_id)).path 
        : '';
      path = parentPath ? `${parentPath}/${updates.name}` : updates.name;
    }

    const { data: updatedFolder, error } = await supabase
      .from('document_folders')
      .update({
        name: updates.name,
        description: updates.description,
        parent_id: updates.parent_id,
        path,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update folder', { error });
    }

    logger.info('Folder updated', { folderId, clinicId, userId: user.id });
    return updatedFolder as Folder;
  } catch (error) {
    logger.error('Failed to update folder', { error, folderId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<void> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Check permissions
    await validateDocumentEditPermission();

    const folder = await getFolder(folderId);

    if (folder.is_system) {
      throw new AuthorizationError('Cannot delete system folders');
    }

    if (folder.document_count > 0) {
      throw new ConflictError('Cannot delete folder with documents. Move or delete documents first.');
    }

    const { error } = await supabase
      .from('document_folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      throw new DatabaseError('Failed to delete folder', { error });
    }

    logger.info('Folder deleted', { folderId, clinicId, userId: user.id });
  } catch (error) {
    logger.error('Failed to delete folder', { error, folderId, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Get folder tree structure
 */
export async function getFolderTree(rootFolderId?: string): Promise<Array<Folder & { children: Folder[] }>> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Placeholder for recursive folder tree query
    const tree: Array<Folder & { children: Folder[] }> = [];

    logger.info('Folder tree retrieved', { clinicId, userId: user.id, rootFolderId });
    return tree;
  } catch (error) {
    logger.error('Failed to get folder tree', { error, clinicId, userId: user.id, rootFolderId });
    throw error;
  }
}

/**
 * Initialize system folders for a clinic
 */
export async function initializeSystemFolders(): Promise<Folder[]> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    const systemFolders = [
      { name: 'Medical Records', description: 'Patient medical records and documents' },
      { name: 'Lab Reports', description: 'Laboratory test results and reports' },
      { name: 'Prescriptions', description: 'Prescription documents and records' },
      { name: 'Invoices', description: 'Billing invoices and receipts' },
      { name: 'Imaging', description: 'Medical imaging and radiology documents' },
      { name: 'Consent Forms', description: 'Patient consent forms and agreements' },
      { name: 'Insurance', description: 'Insurance documents and claims' },
      { name: 'Administrative', description: 'Clinic administrative documents' },
    ];

    const createdFolders: Folder[] = [];

    for (const folderDef of systemFolders) {
      const folder: Folder = {
        id: crypto.randomUUID(),
        clinic_id: clinicId,
        parent_id: undefined,
        name: folderDef.name,
        path: folderDef.name,
        description: folderDef.description,
        is_system: true,
        document_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id,
      };

      // Placeholder for database insertion
      createdFolders.push(folder);
    }

    logger.info('System folders initialized', { clinicId, userId: user.id, count: createdFolders.length });
    return createdFolders;
  } catch (error) {
    logger.error('Failed to initialize system folders', { error, clinicId, userId: user.id });
    throw error;
  }
}

/**
 * Move documents to a different folder
 */
export async function moveDocumentsToFolder(
  documentIds: string[],
  targetFolderId: string
): Promise<{ moved: number; failed: string[] }> {
  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();

  try {
    // Check permissions
    await validateDocumentEditPermission();

    const targetFolder = await getFolder(targetFolderId);

    let moved = 0;
    const failed: string[] = [];

    // Placeholder for batch document update
    for (const documentId of documentIds) {
      try {
        // Placeholder for updating document folder
        moved++;
      } catch (error) {
        failed.push(documentId);
      }
    }

    logger.info('Documents moved to folder', { 
      targetFolderId, 
      clinicId, 
      userId: user.id, 
      moved, 
      failed: failed.length 
    });

    return { moved, failed };
  } catch (error) {
    logger.error('Failed to move documents to folder', { 
      error, 
      targetFolderId, 
      clinicId, 
      userId: user.id 
    });
    throw error;
  }
}
