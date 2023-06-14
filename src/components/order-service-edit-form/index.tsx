/* eslint-disable @typescript-eslint/no-unused-vars */
import { useForm } from 'react-hook-form';
import { AxiosResponse } from 'axios';
import { ChangeEvent, useEffect, useState } from 'react';
import { Box, Button, Flex, Grid, GridItem, Select } from '@chakra-ui/react';
import { error } from 'console';
import { Input } from '../form-fields/input';
import { toast } from '@/utils/toast';
import { api } from '@/config/lib/axios';
import { EquipmentData } from '@/pages/equipments/EquipmentsControl';
import { TextArea } from '../form-fields/text-area';
import { NewControlledSelect } from '../form-fields/new-controlled-select';
import { SingleValue } from 'chakra-react-select';
import { OSSTATUS } from '@/constants/orderservice';

type EditOrderServiceFormValues = {
  equipment: EquipmentData;
  senderUserName: { value: string; label: string };
  senderName: string;
  senderRole: string;
  senderPhone?: string;

  receiverUserName: { value: string; label: string };
  receiverName: string;
  receiverRole: string;
  workstation: { value: string; label: string };
  city: string;
  status: string;
  date: string;
  description: string;
};

interface ISelectOption {
  label: string;
  value: number | string;
}

interface EditOrderServiceFormProps {
  onClose: () => void;
  orderService: EditOrderServiceFormValues;
  refreshRequest: boolean;
  setRefreshRequest: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OrderServiceEditForm({
  onClose,
  orderService,
  refreshRequest,
  setRefreshRequest,
}: EditOrderServiceFormProps) {
  const take = 5;
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);

  const fetchEquipments = async (str: string) => {
    try {
      const { data }: AxiosResponse<EquipmentData[]> = await api.get(
        `equipment/find?searchTipping=${str}&take=${take}`
      );
      setEquipments(data);
    } catch (error) {
      console.error('Nenhum Equipamento encontrado');
    }
  };

  const handleChange = (event: SingleValue<ISelectOption>) => {
    const selectedOption = equipments.find(
      (equipment) => equipment.tippingNumber === event?.value
    );
    setSelectedEquipment(selectedOption as EquipmentData);
  };
  const {
    control,
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors },
    setValue,
  } = useForm<EditOrderServiceFormValues>({
    defaultValues: orderService,
  });

  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData>(
    orderService.equipment
  );

  const debounce = <T extends (...args: any[]) => void>(
    fn: T,
    ms = 400
  ) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  };
  const formattedOptions = <T, K extends keyof T>(
    data: T[],
    label: K,
    value: K
  ): ISelectOption[] => {
    return data?.map((item: T) => {
      const optionLable = String(item[label]);
      const optionValue: number | string = String(item[value]);
      return { label: optionLable, value: optionValue };
    });
  };
  const handleSearch = debounce(async (str) => {
    if (str !== '') {
      fetchEquipments(str);
    }
  }, 500);
  const onSubmit = handleSubmit(async (formData) => {
    try {
      const {
        receiverName,
        senderRole,
        receiverRole,
        workstation,
        city,
        senderPhone,
        description,
        ...rest
      } = formData;
      const payload = {
        receiverName: receiverName.valueOf,
        senderRole: senderRole.valueOf,
        receiverRole: receiverRole.valueOf,
        workstation: workstation.value,
        city: city.valueOf,
        senderPhone: senderPhone?.valueOf,
        description: description.valueOf,
        ...rest,
      };

      const response = await api.put(
        'order-service/updateOrderService',
        payload
      );

      if (response.status === 200) {
        toast.success('Ordem de serviço editada com sucesso', 'Sucesso');
        setRefreshRequest(!setRefreshRequest);
        if (onClose) {
          onClose();
        }
        return;
      }
      toast.error('Erro ao tentar editar a Ordem de serviço', 'Erro');
    } catch {
      toast.error('Erro ao tentar editar a Ordem de serviço', 'Erro');
    }
  });

  useEffect(() => {
    console.log('EQUIPAMENTO CARREGADO', selectedEquipment);
  }, [selectedEquipment]);

  return (
    <form id="equipment-register-form" onSubmit={onSubmit}>
      <Grid templateColumns="repeat(3, 3fr)" gap={6}>
        <GridItem gridColumn="1 / span 2">
          <strong>Nº de tombamento:</strong>
          <Box flex="1">
          <Input
            defaultValue={selectedEquipment.tippingNumber}
            errors={errors.equipment?.tippingNumber}
            isReadOnly
          />
          </Box>
        </GridItem>
        <GridItem>
          <strong>Status:</strong>
          <Box flex="1">
            <NewControlledSelect
              name='status'
              control={control}
              options={OSSTATUS}
            />
          </Box>
        </GridItem>
        <GridItem>
          <strong>Tipo:</strong>
          <Input
            errors={undefined}
            type="text"
            placeholder="Tipo"
            defaultValue={selectedEquipment.type || ''}
            readOnly
          />
        </GridItem>
        <GridItem>
          <strong>Nº de série:</strong>
          <Input
            errors={undefined}
            type="text"
            defaultValue={selectedEquipment.serialNumber}
            readOnly
          />
        </GridItem>
        <GridItem>
          <strong>Marca:</strong>
          <Input
            errors={undefined}
            type="text"
            placeholder="Marca"
            defaultValue={selectedEquipment.brand.name}
            readOnly
          />
        </GridItem>
        <GridItem>
          <strong>Modelo:</strong>
          <Input
            errors={undefined}
            type="text"
            placeholder="Modelo"
            defaultValue={selectedEquipment.model}
            readOnly
          />
        </GridItem>
        <GridItem>
          <strong>Lotação:</strong>
          <Input
            errors={undefined}
            type="text"
            placeholder="Lotação"
            defaultValue={selectedEquipment.unit.localization}
            readOnly
          />
        </GridItem>
        <GridItem>
          <strong>Situação:</strong>
          <Input
            errors={undefined}
            type="text"
            placeholder="Situação"
            defaultValue={selectedEquipment.situacao}
            readOnly
          />
        </GridItem>
        <GridItem gridColumn="1 / span 3">
          <strong>Ordem de Serviço:</strong>
        </GridItem>
        <GridItem>
          <strong>Username entregador</strong>
          <Select {...register('senderUserName')} />
        </GridItem>
        <GridItem>
          <strong>Responsável pela Entrega</strong>
          <Input
            errors={errors.receiverName}
            type="text"
            placeholder="Nome do Recebedor"
            {...register('receiverName')}
          />
        </GridItem>
        <GridItem>
          <strong>Atribuição do Entregador</strong>
          <Input
            errors={errors.senderRole}
            type="text"
            {...register('senderRole')}
          />
        </GridItem>
        <GridItem>
          <strong>Username entregador</strong>
          <Select {...register('senderUserName')} />
        </GridItem>
        <GridItem gridColumn="1 / span 1">
          <strong>Responsável pelo recebimento:</strong>
          <Input
            errors={errors.receiverName}
            type="text"
            {...register('receiverName')}
          />
        </GridItem>
        <GridItem>
          <strong>Atribuição do Recebedor</strong>
          <Input
            errors={errors.receiverRole}
            type="text"
            {...register('receiverRole')}
          />
        </GridItem>
        <GridItem>
          <strong>Telefone:</strong>
          <Input
            errors={errors.senderPhone}
            type="text"
            placeholder="Telefone"
            {...register('senderPhone')}
          />
        </GridItem>
        <GridItem gridColumn="1 / span 3">
          <TextArea
            errors={errors.description}
            label="Descrição:"
            maxChars={255}
            {...register('description', {
              maxLength: 255,
            })}
          />
        </GridItem>
        </Grid>
        <Flex gap="9rem" mt="2rem" mb="2rem" justify="center">
          <GridItem>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </GridItem>
          <GridItem>
            <Button type="submit" variant="primary">
              Salvar
            </Button>
          </GridItem>
        </Flex>
    </form>
  );
}
