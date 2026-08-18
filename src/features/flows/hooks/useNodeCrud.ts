import { useCallback, useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useCreateNode } from '../api/useCreateNode';
import { useUpdateNode } from '../api/useUpdateNode';
import { preCodeItemCode } from '../types';
import type { Node, OnErrorStrategy, PreCodeItem, NodeTodo, NodeFunction } from '../types';

export type NodeFormTab = 'general' | 'precode' | 'todos' | 'tools' | 'postcode';

export interface NodeForm {
  name: string;
  systemPrompt: string;
  tools: string[];
  preCode: PreCodeItem[];
  postCode: PreCodeItem[];
  todos: NodeTodo[];
  onError: string;
}

const emptyNodeForm: NodeForm = { name: '', systemPrompt: '', tools: [], preCode: [], postCode: [], todos: [], onError: 'hitl' };

function parseJsonArr(val: string | null, fieldLabel: string, onError: (message: string) => void): PreCodeItem[] {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    if (!Array.isArray(p)) {
      console.error(`[useNodeCrud] ${fieldLabel} no es un array JSON:`, val);
      onError(`${fieldLabel} tiene un formato inválido y no se pudo cargar`);
      return [];
    }
    return p;
  } catch (err) {
    console.error(`[useNodeCrud] Error parseando ${fieldLabel}:`, err, val);
    onError(`No se pudo leer ${fieldLabel} (dato corrupto)`);
    return [];
  }
}

type ArgsModalCtx = { field: 'preCode' | 'postCode'; form: 'edit' | 'create'; code: string };

/**
 * Estado y mutaciones de CRUD de nodos: formularios de edición y creación
 * (comparten shape/tabs), y el modal de argumentos dinámicos de funciones
 * que se abre automáticamente cuando se agrega un pre/post-code que los
 * requiere.
 */
export function useNodeCrud(functions: NodeFunction[]) {
  const { showToast } = useToast();
  const createNode = useCreateNode();
  const updateNode = useUpdateNode();

  const [editNodeTarget, setEditNodeTarget] = useState<Node | null>(null);
  const [nodeForm, setNodeForm] = useState<NodeForm>(emptyNodeForm);
  const [nodeFormErrors, setNodeFormErrors] = useState<{ name?: string }>({});
  const [nodeFormTab, setNodeFormTab] = useState<NodeFormTab>('general');

  const [createNodeOpen, setCreateNodeOpen] = useState(false);
  const [createNodeForm, setCreateNodeForm] = useState<NodeForm>(emptyNodeForm);
  const [createNodeErrors, setCreateNodeErrors] = useState<{ name?: string }>({});
  const [createNodeTab, setCreateNodeTab] = useState<NodeFormTab>('general');

  const [argsModal, setArgsModal] = useState<ArgsModalCtx | null>(null);
  const [argsValues, setArgsValues] = useState<Record<string, unknown>>({});
  const [argsArrayInputs, setArgsArrayInputs] = useState<Record<string, string>>({});

  const fnHasArgs = (code: string) => {
    const fn = functions.find((f) => f.code === code);
    return !!fn?.toolDefinition?.function?.parameters?.required?.length;
  };

  const openArgsModal = (field: 'preCode' | 'postCode', form: 'edit' | 'create', code: string) => {
    const items = form === 'edit' ? nodeForm[field] : createNodeForm[field];
    const existing = items.find((i) => preCodeItemCode(i) === code);
    const existingArgs = existing && typeof existing === 'object' ? (existing as { code: string; args: Record<string, unknown> }).args : {};
    setArgsModal({ field, form, code });
    setArgsValues(existingArgs ?? {});
    setArgsArrayInputs({});
  };

  const saveArgsModal = () => {
    if (!argsModal) return;
    const { field, form, code } = argsModal;
    const updatedItem: PreCodeItem = { code, args: argsValues };
    const applyUpdate = (f: NodeForm) => ({
      ...f,
      [field]: (f[field] as PreCodeItem[]).map((i) => preCodeItemCode(i) === code ? updatedItem : i),
    });
    if (form === 'edit') setNodeForm(applyUpdate);
    else setCreateNodeForm(applyUpdate);
    setArgsModal(null);
  };

  // Al seleccionar en el MultiSelect, si la función requiere args abre el modal automáticamente
  const handlePreCodeChange = (field: 'preCode' | 'postCode', form: 'edit' | 'create', newCodes: string[]) => {
    const currentItems: PreCodeItem[] = form === 'edit' ? nodeForm[field] : createNodeForm[field];
    const currentCodes = currentItems.map(preCodeItemCode);
    const added = newCodes.find((c) => !currentCodes.includes(c));

    // Construir nueva lista preservando items con args existentes
    const newItems: PreCodeItem[] = newCodes.map((code) => {
      const existing = currentItems.find((i) => preCodeItemCode(i) === code);
      if (existing) return existing;
      // nuevo item: si necesita args, lo creamos como objeto vacío; si no, string
      return fnHasArgs(code) ? { code, args: {} } : code;
    });

    const setter = form === 'edit' ? setNodeForm : setCreateNodeForm;
    setter((f) => ({ ...f, [field]: newItems }));

    // Si el item recién agregado requiere args, abrir modal
    if (added && fnHasArgs(added)) {
      openArgsModal(field, form, added);
    }
  };

  const openEditNode = useCallback((node: Node) => {
    setEditNodeTarget(node);
    setNodeForm({
      name: node.name,
      systemPrompt: node.systemPrompt ?? '',
      tools: node.tools.map(preCodeItemCode),
      preCode: parseJsonArr(node.preCode, 'Pre Code', (message) => showToast(message, 'error')),
      postCode: parseJsonArr(node.postCode, 'Post Code', (message) => showToast(message, 'error')),
      todos: node.todos ?? [],
      onError: node.onError,
    });
    setNodeFormErrors({});
    setNodeFormTab('general');
  }, [showToast]);

  const openCreateNode = useCallback(() => {
    setCreateNodeForm(emptyNodeForm);
    setCreateNodeErrors({});
    setCreateNodeTab('general');
    setCreateNodeOpen(true);
  }, []);

  const handleUpdateNode = async () => {
    if (!editNodeTarget) return;
    if (!nodeForm.name.trim()) { setNodeFormErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await updateNode.mutateAsync({
        id: editNodeTarget.id,
        dto: {
          name: nodeForm.name.trim(),
          systemPrompt: nodeForm.systemPrompt || undefined,
          tools: nodeForm.tools,
          preCode: nodeForm.preCode.length ? JSON.stringify(nodeForm.preCode) : undefined,
          postCode: nodeForm.postCode.length ? JSON.stringify(nodeForm.postCode) : undefined,
          todos: nodeForm.todos.length ? nodeForm.todos : undefined,
          onError: nodeForm.onError as OnErrorStrategy,
        },
      });
      showToast('Nodo actualizado', 'success');
      setEditNodeTarget(null);
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al actualizar el nodo'), 'error');
    }
  };

  const handleCreateNodeFromPanel = async () => {
    if (!createNodeForm.name.trim()) { setCreateNodeErrors({ name: 'El nombre es requerido' }); return; }
    try {
      await createNode.mutateAsync({
        name: createNodeForm.name.trim(),
        systemPrompt: createNodeForm.systemPrompt || undefined,
        tools: createNodeForm.tools.length ? createNodeForm.tools : undefined,
        preCode: createNodeForm.preCode.length ? JSON.stringify(createNodeForm.preCode) : undefined,
        postCode: createNodeForm.postCode.length ? JSON.stringify(createNodeForm.postCode) : undefined,
        todos: createNodeForm.todos.length ? createNodeForm.todos : undefined,
        onError: createNodeForm.onError as OnErrorStrategy,
      });
      showToast('Nodo creado', 'success');
      setCreateNodeOpen(false);
      setCreateNodeForm(emptyNodeForm);
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al crear el nodo'), 'error');
    }
  };

  return {
    createNode, updateNode,
    editNodeTarget, setEditNodeTarget,
    nodeForm, setNodeForm, nodeFormErrors, nodeFormTab, setNodeFormTab,
    createNodeOpen, setCreateNodeOpen,
    createNodeForm, setCreateNodeForm, createNodeErrors, createNodeTab, setCreateNodeTab,
    argsModal, setArgsModal, argsValues, setArgsValues, argsArrayInputs, setArgsArrayInputs,
    openArgsModal, saveArgsModal, handlePreCodeChange,
    openEditNode, openCreateNode,
    handleUpdateNode, handleCreateNodeFromPanel,
  };
}
