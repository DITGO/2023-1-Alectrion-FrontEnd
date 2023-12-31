import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRightIcon, ArrowLeftIcon, CloseIcon } from '@chakra-ui/icons';
import { BiEditAlt, BiSearch } from 'react-icons/bi';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Button,
  TableContainer,
  Divider,
  Box,
  useDisclosure,
  Flex,
  Grid,
  GridItem,
  Checkbox,
} from '@chakra-ui/react';
import { AxiosResponse } from 'axios';
import { MdPictureAsPdf } from 'react-icons/md';
import { BsFiletypeXlsx } from 'react-icons/bs';
import { GrDocumentCsv } from 'react-icons/gr';
import { toast } from '@/utils/toast';
import { SideBar } from '@/components/side-bar';
import { api, apiSchedula } from '../../config/lib/axios';
import { EquipmentRegisterModal } from '@/components/equipment-register-modal';
import { EquipmentViewModal } from '@/components/equipment-view-modal';
import { theme } from '@/styles/theme';
import { EquipmentEditModal } from '@/components/equipment-edit-modal';
import { STATUS, TIPOS_EQUIPAMENTO, Workstation } from '@/constants/equipment';
import { Datepicker } from '@/components/form-fields/date';
import { Input } from '@/components/form-fields/input';
import { MovementRegisterModal } from '@/components/movement-register-modal';
import { TermModal } from '@/components/term-modal';
import { movement } from '../movements/MovementControl';
import { NewControlledSelect } from '@/components/form-fields/new-controlled-select';
import { ReportModal } from '@/components/report-modal';
import { getBrands, getEquipments } from '@/services/requests/equipment';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentsUploadModal } from '@/components/equipment-upload-modal';
import { listOfYears } from '@/utils/format-date';

interface ISelectOption {
  label: string;
  value: number | string;
}

interface TypeData {
  id: number;
  name: string;
}

export interface BrandData {
  id: number;
  name: string;
}

export interface EquipmentData {
  equipment: any;
  tippingNumber: string;
  serialNumber: string;
  type: {
    id: string;
    name: string;
  };
  situacao: string;
  estado: string;
  model: string;
  acquisitionDate: Date;
  description?: string;
  screenSize?: string;
  power?: string;
  screenType?: string;
  processor?: string;
  storageType?: string;
  storageAmount?: string;
  ram_size?: string;
  createdAt?: string;
  updatedAt: string;
  id: string;
  brand: {
    name: string;
  };
  acquisition: { name: string };
  unit: {
    name: string;
    localization: string;
  };
}

type FilterValues = {
  type?: string;
  brand?: string;
  lastModifiedDate?: string;
  unit?: ISelectOption;
  situation?: ISelectOption;
  search: string;
  model?: ISelectOption;
  ram_size?: string;
  description?: string;
  processor?: string;
  power?: string;
  storageType?: string;
  initialDate?: string;
  finalDate?: string;
  screenType?: string;
  screenSize?: string;
  acquisitionYear?: string;
  acquisition?: string;
};

// função que define os eestados searchTerm e searchType com o useState, searchTerm é o termo de pesquisa que o usuário insere na caixa de entrada, enquanto searchType é o tipo de equipamento que o usuário seleciona no menu suspenso.//
function EquipmentTable() {
  const [equipments, setEquipments] = useState<EquipmentData[]>([]);
  const [nextEquipments, setNextEquipments] = useState<EquipmentData[]>([]);
  const [equipsToExport, setEquipsToExport] = useState<EquipmentData[]>([]);
  const [models, setModels] = useState<ISelectOption[]>();
  const [brands, setBrands] = useState<ISelectOption[]>();
  const [ram_sizes, setRam_sizes] = useState<ISelectOption[]>();
  const [storageTypes, setStorageTypes] = useState<ISelectOption[]>();
  const [acquisitionTypes, setAcquisitionTypes] = useState<ISelectOption[]>();
  const [processors, setProcessors] = useState<ISelectOption[]>();
  const [powers, setPowers] = useState<ISelectOption[]>();
  const [screenTypes, setScreenTypes] = useState<ISelectOption[]>();
  const [screenSizes, setScreenSizes] = useState<ISelectOption[]>();
  const [selectedMovement, setSelectedMovement] = useState<movement>();
  const [selectedEquipmentToEdit, setSelectedEquipmentToEdit] =
    useState<EquipmentData>();
  const [selectedEquipmentToMovement, setSelectedEquipmentToMovement] =
    useState<EquipmentData[]>([]);
  const [refreshRequest, setRefreshRequest] = useState<boolean>(false);
  const [workstations, setWorkstations] = useState<ISelectOption[]>();

  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [type, setType] = useState<string>('');
  const { user } = useAuth();

  const {
    control,
    watch,
    register,
    formState: { errors },
    reset,
  } = useForm<FilterValues>({ mode: 'onChange' });

  const watchFilter = watch();

  const formattedDate = (date: string | undefined) => {
    if (date !== null && date !== '' && date) {
      return new Date(date).toLocaleDateString('en-us');
    }
  };

  const handleFilterChange = () => {
    const {
      type,
      lastModifiedDate,
      situation,
      unit,
      model,
      brand,
      ram_size,
      initialDate,
      finalDate,
      processor,
      power,
      storageType,
      screenSize,
      screenType,
      acquisitionYear,
      acquisition,
    } = watchFilter;

    const dataFormatted = {
      type,
      updatedAt: formattedDate(lastModifiedDate),
      situation,
      unit,
      search,
      model,
      brand,
      ram_size,
      processor,
      power,
      storageType,
      initialDate: formattedDate(initialDate),
      finalDate: formattedDate(finalDate),
      screenSize,
      screenType,
      acquisitionYear,
      acquisition,
    };
    const filteredDataFormatted = [
      ...Object.entries(dataFormatted).filter(
        (field) => field[1] !== undefined && field[1] !== ''
      ),
    ];

    const query = `${filteredDataFormatted
      .map((field) => `${field[0]}=${field[1]}`)
      .join('&')}`;
    setFilter(query);
  };

  const cleanFilters = () => {
    setFilter('');
    setSearch('');
    reset();
  };

  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData>();

  const {
    isOpen: isOpenEditEquipment,
    onClose: onCloseEditEquipment,
    onOpen: onOpenEditEquipment,
  } = useDisclosure();

  const { isOpen, onClose, onOpen } = useDisclosure();

  const {
    isOpen: isOpenTerm,
    onClose: onCloseTerm,
    onOpen: onOpenTerm,
  } = useDisclosure();

  const {
    isOpen: isOpenRegister,
    onClose: onCloseRegister,
    onOpen: onOpenRegister,
  } = useDisclosure();

  const {
    isOpen: isReportOpen,
    onClose: onReportClose,
    onOpen: onReportOpen,
  } = useDisclosure();

  const {
    isOpen: isUploadOpen,
    onClose: onUploadClose,
    onOpen: onUploadOpen,
  } = useDisclosure();

  const {
    isOpen: isViewOpen,
    onClose: onViewClose,
    onOpen: onViewOpen,
  } = useDisclosure();

  const formattedWorkstations = (data: Workstation[]): ISelectOption[] => {
    return data?.map((item: Workstation) => {
      return { label: item.name, value: item.name };
    });
  };

  const getWorkstations = async () => {
    apiSchedula
      .get<Workstation[]>('workstations')
      .then((response) => {
        setWorkstations(formattedWorkstations(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const debounce = <T extends (...args: any[]) => void>(fn: T, ms = 400) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  };
  const handleSearch = debounce(() => {
    setSearch(watchFilter.search);
  }, 400);

  const fetchItems = async () => {
    try {
      const { data }: AxiosResponse<EquipmentData[]> = await api.get(
        `equipment/find?take=${limit}&skip=${offset}&${filter}`
      );
      setEquipments(data);
    } catch (error) {
      setEquipments([]);
      toast.error('Nenhum Equipamento encontrado');
    }
  };

  const fetchNextItems = async () => {
    try {
      const { data }: AxiosResponse<EquipmentData[]> = await api.get(
        `equipment/find?take=${limit}&skip=${offset + limit}&${filter}`
      );
      setNextEquipments(data);
    } catch (error) {
      setNextEquipments([]);
      toast.error('Nenhum Equipamento encontrado');
    }
  };

  async function setFilterOptions() {
    const uniqueModels: ISelectOption[] = [];
    const uniqueRamSizes: ISelectOption[] = [];
    const uniqueBrands: ISelectOption[] = [];
    const uniqueStorageTypes: ISelectOption[] = [];
    const uniqueProcessors: ISelectOption[] = [];
    const uniquePowers: ISelectOption[] = [];
    const uniqueScreenTypes: ISelectOption[] = [];
    const uniqueScreenSizes: ISelectOption[] = [];
    const uniqueAcquisitionTypes: ISelectOption[] = [];

    const array = await getEquipments('');
    const requestedBrands = await getBrands();

    requestedBrands.forEach((obj: BrandData) => {
      uniqueBrands.push({ label: obj.name, value: obj.id });
    });

    array.forEach((obj) => {
      if (obj.model && !uniqueModels.some((item) => item.value === obj.model)) {
        uniqueModels.push({ label: obj.model, value: obj.model });
      }
      if (
        obj.ram_size &&
        !uniqueRamSizes.some((item) => item.value === obj.ram_size)
      ) {
        uniqueRamSizes.push({ label: obj.ram_size, value: obj.ram_size });
      }
      if (
        obj.storageType &&
        !uniqueStorageTypes.some((item) => item.value === obj.storageType)
      ) {
        uniqueStorageTypes.push({
          label: obj.storageType,
          value: obj.storageType,
        });
      }
      if (
        obj.processor &&
        !uniqueProcessors.some((item) => item.value === obj.processor)
      ) {
        uniqueProcessors.push({ label: obj.processor, value: obj.processor });
      }
      if (obj.power && !uniquePowers.some((item) => item.value === obj.power)) {
        uniquePowers.push({ label: obj.power, value: obj.power });
      }
      if (
        obj.screenType &&
        !uniqueScreenTypes.some((item) => item.value === obj.screenType)
      ) {
        uniqueScreenTypes.push({
          label: obj.screenType,
          value: obj.screenType,
        });
      }
      if (
        obj.screenSize &&
        !uniqueScreenSizes.some((item) => item.value === obj.screenSize)
      ) {
        uniqueScreenSizes.push({
          label: obj.screenSize,
          value: obj.screenSize,
        });
      }
      if (
        obj.acquisition.name &&
        !uniqueAcquisitionTypes.some(
          (item) => item.value === obj.acquisition.name
        )
      ) {
        uniqueAcquisitionTypes.push({
          label: obj.acquisition.name,
          value: obj.acquisition.name,
        });
      }
    });

    setModels(uniqueModels);
    setBrands(uniqueBrands);
    setRam_sizes(uniqueRamSizes);
    setStorageTypes(uniqueStorageTypes);
    setProcessors(uniqueProcessors);
    setPowers(uniquePowers);
    setScreenTypes(uniqueScreenTypes);
    setScreenSizes(uniqueScreenSizes);
    setAcquisitionTypes(uniqueAcquisitionTypes);
  }

  useEffect(() => {
    getWorkstations();
    setFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleSearch();
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchFilter]);

  useEffect(() => {
    fetchItems();
    fetchNextItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, refreshRequest, filter]);

  const handleEdit = (equipment: EquipmentData) => {
    if (equipment) setSelectedEquipmentToEdit(equipment);
    onOpenEditEquipment();
  };

  const handleView = (equipment: EquipmentData) => {
    if (equipment) setSelectedEquipment(equipment);
    onViewOpen();
  };

  const handleMovement = () => {
    if (
      selectedEquipmentToMovement === undefined ||
      selectedEquipmentToMovement.length === 0
    ) {
      toast.error('Selecione ao menos um equipamento para movimentar');
    } else {
      onOpenRegister();
    }
  };
  const handleCheckboxClick = (equipment: EquipmentData) => {
    if (selectedEquipmentToMovement.includes(equipment)) {
      setSelectedEquipmentToMovement(
        selectedEquipmentToMovement.filter((equip) => equip.id !== equipment.id)
      );
    } else {
      setSelectedEquipmentToMovement([
        ...selectedEquipmentToMovement,
        equipment,
      ]);
    }
  };

  const [types, setTypes] = useState<TypeData[]>([]);

  const fetchTypes = async (str: string) => {
    try {
      const { data }: AxiosResponse<TypeData[]> = await api.get(
        `equipment/type?search=${str}`
      );
      setTypes(data);
    } catch (error) {
      console.error('Nenhum Equipamento encontrado');
    }
  };

  useEffect(() => {
    fetchTypes('');
  }, []);

  const handleReportExport = async (selectedType: string) => {
    setType(selectedType);
    setEquipsToExport(await getEquipments(filter));
    onReportOpen();
  };

  return (
    <Grid templateColumns="1fr 5fr" gap={6}>
      <GridItem>
        <SideBar />
      </GridItem>
      <GridItem>
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignContent="center"
          alignItems="center"
          width="100%"
        >
          <Flex flexDirection="column" width="80%">
            <Flex
              justifyContent="space-between"
              width="100%"
              alignItems="center"
            >
              <Text
                margin="20px 0 15px 0"
                color={theme.colors.black}
                fontWeight="semibold"
                fontSize="4xl"
              >
                Controle de Equipamento
              </Text>
              {user?.role !== 'consulta' && (
                <Button colorScheme={theme.colors.primary} onClick={onOpen}>
                  Cadastrar Equipamento
                </Button>
              )}
            </Flex>
            <Flex justifyContent="space-between" width="100%">
              <Text color="#00000" fontWeight="medium" fontSize="2xl">
                Últimos Equipamentos Modificados
              </Text>
              <Flex flexDirection="column">
                <Flex
                  gap={5}
                  justifyContent="center"
                  width="100%"
                  alignItems="center"
                  padding={4}
                >
                  <GrDocumentCsv
                    size="35.2px"
                    cursor="pointer"
                    onClick={() => {
                      handleReportExport('csv');
                    }}
                  />
                  <BsFiletypeXlsx
                    size="35.2px"
                    cursor="pointer"
                    onClick={() => {
                      handleReportExport('xls');
                    }}
                  />
                  <MdPictureAsPdf
                    size="35.2px"
                    cursor="pointer"
                    onClick={() => {
                      handleReportExport('pdf');
                    }}
                  />
                </Flex>
              </Flex>
            </Flex>
            <Divider borderColor="#00000" margin="5px 0 5px 0" />
            <Flex
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              width="100%"
            >
              <form id="equipment-filter" style={{ width: '100%' }}>
                <Accordion allowMultiple>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          Filtros
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel zIndex={4}>
                      <Grid
                        templateColumns="repeat(5, 5fr)"
                        gap="5px"
                        alignItems="5px"
                        mb="15px"
                      >
                        <NewControlledSelect
                          control={control}
                          name="type"
                          id="type"
                          options={types.map((type) => ({
                            label: type?.name ?? '',
                            value: type?.id ?? '',
                          }))}
                          placeholder="Tipo"
                          cursor="pointer"
                          variant="unstyled"
                          fontWeight="semibold"
                          size="sm"
                          filterStyle
                        />
                        {watchFilter.type === 'Monitor' && (
                          <>
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="screenSize"
                              id="screenSize"
                              options={screenSizes}
                              placeholder="Tamanho da tela"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="screenType"
                              id="screenType"
                              options={screenTypes}
                              placeholder="Tipo de tela"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                          </>
                        )}
                        {watchFilter.type === 'CPU' && (
                          <>
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="ram_size"
                              id="ram_size"
                              options={ram_sizes}
                              placeholder="Ram"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="processor"
                              id="processor"
                              options={processors}
                              placeholder="Processador"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="storageType"
                              id="storageType"
                              options={storageTypes}
                              placeholder="Tipo de armazenamento"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                          </>
                        )}
                        {(watchFilter.type === 'Estabilizador' ||
                          watchFilter.type === 'Nobreak') && (
                          <NewControlledSelect
                            filterStyle
                            control={control}
                            name="power"
                            id="power"
                            options={powers}
                            placeholder="Potência"
                            cursor="pointer"
                            variant="unstyled"
                            fontWeight="semibold"
                            size="sm"
                          />
                        )}
                        <Datepicker
                          outsideModal
                          border={false}
                          placeholderText="Última modificação"
                          name="lastModifiedDate"
                          control={control}
                        />
                        <Datepicker
                          outsideModal
                          border={false}
                          placeholderText="Cadastrado depois de"
                          name="initialDate"
                          control={control}
                        />
                        <Datepicker
                          outsideModal
                          border={false}
                          placeholderText="Cadastrado antes de"
                          name="finalDate"
                          control={control}
                        />
                        <NewControlledSelect
                          control={control}
                          name="unit"
                          id="unit"
                          options={workstations}
                          placeholder="Localização"
                          cursor="pointer"
                          variant="unstyled"
                          fontWeight="semibold"
                          size="sm"
                          filterStyle
                        />
                        <NewControlledSelect
                          control={control}
                          name="acquisitionYear"
                          id="unit"
                          options={listOfYears}
                          placeholder="Ano de Aquisição"
                          cursor="pointer"
                          variant="unstyled"
                          fontWeight="semibold"
                          size="sm"
                          filterStyle
                        />
                        <NewControlledSelect
                          control={control}
                          name="acquisition"
                          id="acquisition"
                          options={acquisitionTypes}
                          placeholder="Tipo de aquisição"
                          cursor="pointer"
                          variant="unstyled"
                          fontWeight="semibold"
                          size="sm"
                          filterStyle
                        />
                        <NewControlledSelect
                          control={control}
                          name="situation"
                          id="situation"
                          options={STATUS}
                          placeholder="Situação"
                          cursor="pointer"
                          variant="unstyled"
                          fontWeight="semibold"
                          size="sm"
                          filterStyle
                        />
                        <NewControlledSelect
                          filterStyle
                          control={control}
                          name="brand"
                          id="brand"
                          options={brands}
                          placeholder="Marca"
                          cursor="pointer"
                          variant="unstyled"
                          fontWeight="semibold"
                          size="sm"
                        />
                        <NewControlledSelect
                          filterStyle
                          control={control}
                          name="model"
                          id="model"
                          options={models}
                          placeholder="Modelos"
                          cursor="pointer"
                          variant="unstyled"
                          fontWeight="semibold"
                          size="sm"
                        />
                        <Input
                          placeholder="Pesquisa"
                          minWidth="15vw"
                          errors={errors.search}
                          {...register('search')}
                          rightElement={<BiSearch />}
                        />
                      </Grid>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </form>
            </Flex>
            {filter !== '' ? (
              <Flex w="100%" alignItems="center" justifyContent="start">
                <Button
                  variant="unstyled"
                  fontSize="14px"
                  leftIcon={<CloseIcon mr="0.5rem" boxSize="0.6rem" />}
                  onClick={cleanFilters}
                >
                  Limpar filtros aplicados
                </Button>
              </Flex>
            ) : null}
            <Flex flexDirection="column" width="100%">
              <TableContainer
                borderRadius="15px 15px 0 0 "
                height="55vh"
                whiteSpace="inherit"
                fontSize="sm"
                border="1px"
                borderColor={theme.colors.primary}
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    width: '6px',
                    background: '#C6C6C6',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#F49320',
                    borderRadius: '24px',
                  },
                }}
              >
                <Table variant="striped" colorScheme="orange" width="100%">
                  <Thead
                    bg={theme.colors.primary}
                    fontWeight="semibold"
                    order={theme.colors.primary}
                    position="sticky"
                    top="0"
                    zIndex={+1}
                  >
                    <Tr width="100%" color={theme.colors.white}>
                      <Td>Equipamento</Td>
                      <Td>N Tombamento</Td>
                      <Td>N Série</Td>
                      <Td>Última Modificação</Td>
                      <Td />
                      <Td />
                    </Tr>
                  </Thead>
                  <Tbody fontWeight="semibold" maxHeight="200px">
                    {equipments.map((equipment) => (
                      <Tr
                        onClick={(event) => {
                          handleView(equipment);
                          event.stopPropagation();
                        }}
                        key={equipment.id}
                        cursor="pointer"
                      >
                        <Td fontWeight="medium">
                          {equipment.situacao} - {equipment.unit.name}
                          <Td p={0} fontWeight="semibold">
                            {equipment.type.name} {equipment.brand.name}
                          </Td>
                        </Td>
                        <Td>{equipment.tippingNumber}</Td>
                        <Td>{equipment.serialNumber}</Td>
                        <Td>
                          {new Date(equipment.updatedAt).toLocaleDateString(
                            'pt-BR'
                          )}
                        </Td>
                        <Td
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(equipment);
                          }}
                          width="5%"
                        >
                          <button>
                            <BiEditAlt size={23} />
                          </button>
                        </Td>
                        <Td
                          width="5%"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <Checkbox
                            onChange={() => {
                              handleCheckboxClick(equipment);
                            }}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              <Box
                bgColor={theme.colors.primary}
                cursor="pointer"
                fontSize="sm"
                fontWeight="semibold"
                width="100%"
                textAlign="center"
                color={theme.colors.white}
                padding="1rem 0 1rem 0"
                borderRadius=" 0  0 15px 15px"
                onClick={handleMovement}
              >
                Movimentar
              </Box>
              <Flex justifyContent="center" mt="15px">
                {currentPage > 1 && (
                  <Button
                    variant="link"
                    color="#00000"
                    p={2}
                    leftIcon={<ArrowLeftIcon />}
                    _hover={{ cursor: 'pointer', color: 'orange.500' }}
                    onClick={() => {
                      setCurrentPage(currentPage - 1);
                      setOffset(offset - limit);
                    }}
                  >
                    Anterior
                  </Button>
                )}
                {nextEquipments.length > 0 && (
                  <Button
                    variant="link"
                    color="#00000"
                    p={2}
                    rightIcon={<ArrowRightIcon />}
                    _hover={{ cursor: 'pointer', color: 'orange.500' }}
                    onClick={() => {
                      setCurrentPage(currentPage + 1);
                      setOffset(offset + limit);
                    }}
                  >
                    Próximo
                  </Button>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <EquipmentRegisterModal
          onClose={onClose}
          isOpen={isOpen}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
          onUploadOpen={onUploadOpen}
        />
        <EquipmentEditModal
          onClose={onCloseEditEquipment}
          isOpen={isOpenEditEquipment}
          equip={selectedEquipmentToEdit}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
        />
        <EquipmentViewModal
          onClose={onViewClose}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
          selectedEquipment={selectedEquipment}
          isOpen={isViewOpen}
          handleEdit={handleEdit}
        />
        <MovementRegisterModal
          isOpen={isOpenRegister}
          onClose={onCloseRegister}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
          selectedEquipmentToMovement={selectedEquipmentToMovement}
          setSelectedMovement={setSelectedMovement}
          onOpenTerm={onOpenTerm}
        />
        <TermModal
          isOpen={isOpenTerm}
          onClose={onCloseTerm}
          selectedMoviment={selectedMovement}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
        />
        <ReportModal
          isOpen={isReportOpen}
          onClose={onReportClose}
          type={type}
          equipments={equipsToExport}
        />
        <EquipmentsUploadModal
          onClose={onUploadClose}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
          isOpen={isUploadOpen}
        />
      </GridItem>
    </Grid>
  );
}
export { EquipmentTable };
