import { X } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import type { NodeFunction } from '@/features/flows/types';

interface ArgsModalCtx {
  field: 'preCode' | 'postCode';
  form: 'edit' | 'create';
  code: string;
}

interface NodeArgsModalProps {
  argsModal: ArgsModalCtx | null;
  onClose: () => void;
  onSave: () => void;
  functions: NodeFunction[];
  argsValues: Record<string, unknown>;
  setArgsValues: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
  argsArrayInputs: Record<string, string>;
  setArgsArrayInputs: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
}

/** Modal para configurar los parámetros dinámicos (args) de una función pre/post-code. */
export const NodeArgsModal = ({
  argsModal,
  onClose,
  onSave,
  functions,
  argsValues,
  setArgsValues,
  argsArrayInputs,
  setArgsArrayInputs,
}: NodeArgsModalProps) => {
  return (
    <Modal isOpen={!!argsModal} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Configurar {argsModal?.code}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {argsModal && (() => {
            const fn = functions.find((f) => f.code === argsModal.code);
            const params = fn?.toolDefinition?.function?.parameters?.properties ?? {};
            const required = fn?.toolDefinition?.function?.parameters?.required ?? [];
            return Object.entries(params).map(([paramName, param]) => {
              const isArray = param.type === 'array';
              const currentArr = (argsValues[paramName] as string[] | undefined) ?? [];
              const currentStr = (argsValues[paramName] as string | undefined) ?? '';
              const inputVal = argsArrayInputs[paramName] ?? '';
              return (
                <FormField key={paramName} label={paramName} optional={!required.includes(paramName)}>
                  {param.description && <p className="text-xs text-text-tertiary mb-1.5">{param.description}</p>}
                  {isArray ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ej: banking_info.banrural.cuenta"
                          value={inputVal}
                          onChange={(e) => setArgsArrayInputs((prev) => ({ ...prev, [paramName]: e.target.value.toLowerCase() }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const v = inputVal.trim();
                              if (v && !currentArr.includes(v)) {
                                setArgsValues((prev) => ({ ...prev, [paramName]: [...currentArr, v] }));
                                setArgsArrayInputs((prev) => ({ ...prev, [paramName]: '' }));
                              }
                            }
                          }}
                        />
                        <Button variant="secondary" onClick={() => {
                          const v = inputVal.trim();
                          if (v && !currentArr.includes(v)) {
                            setArgsValues((prev) => ({ ...prev, [paramName]: [...currentArr, v] }));
                            setArgsArrayInputs((prev) => ({ ...prev, [paramName]: '' }));
                          }
                        }}>Agregar</Button>
                      </div>
                      {currentArr.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {currentArr.map((item: string) => (
                            <span key={item} className="flex items-center gap-1 px-2 py-0.5 bg-accent-purple/15 text-accent-purple text-xs font-medium rounded-md">
                              {item}
                              <button type="button" onClick={() => setArgsValues((prev) => ({ ...prev, [paramName]: currentArr.filter((x: string) => x !== item) }))} className="hover:opacity-60 transition-opacity">
                                <X size={10} strokeWidth={2.5} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={currentStr}
                      onChange={(e) => setArgsValues((prev) => ({ ...prev, [paramName]: e.target.value }))}
                    />
                  )}
                </FormField>
              );
            });
          })()}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave}>Guardar</Button>
      </ModalFooter>
    </Modal>
  );
};
