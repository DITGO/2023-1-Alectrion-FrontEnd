/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRightIcon, ArrowLeftIcon, CloseIcon } from '@chakra-ui/icons';
import { BiSearch } from 'react-icons/bi';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Divider,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Thead,
  Tr,
  useDisclosure,
  Box,
} from '@chakra-ui/react';
import { AxiosResponse } from 'axios';
import { MdPictureAsPdf } from 'react-icons/md';
import { BsFiletypeXlsx } from 'react-icons/bs';
import { GrDocumentCsv } from 'react-icons/gr';
import { FaFileAlt, FaTools } from 'react-icons/fa';
import { toast } from '@/utils/toast';
import { SideBar } from '@/components/side-bar';
import { api, apiSchedula } from '../../config/lib/axios';
import { theme } from '@/styles/theme';
import {
  SelectItem,
  TIPOS_EQUIPAMENTO,
  Workstation,
} from '@/constants/equipment';
import { Datepicker } from '@/components/form-fields/date';
import { Input } from '@/components/form-fields/input';
import { OSStatusMap, OSStatusStyleMap, OSSTATUS } from '@/constants/orderservice';
import { NewControlledSelect } from '@/components/form-fields/new-controlled-select';
import { OrderServiceEditModal } from '@/components/order-service-edit-modal';
import { OrderServiceRegisterModal } from '@/components/order-service-register-modal';
import { ReportModal } from '@/components/report-modal-order-service/Index';
import { getOrderServices } from '@/utils/getOrderServices';
import { OrderServiceTermModal } from '@/components/order-service-term-modal';
import { BrandData } from '@/components/edit-brands-form';

interface ISelectOption {
  label: string;
  value: number | string;
}

interface TypeData {
  id: number;
  name: string;
}

export interface Equipment {
  description: string;
  tippingNumber: string;
  serialNumber: string;
  brand: {
    name: string;
  };
  type: { name: string };
  id: string;
  model: string;
  unit: {
    name: string;
    localization: string;
  };
}

export interface Brand{
  name: string;
  id: string;
}
export interface OrderServiceData {
  id: string;
  description?: string;
  authorId: string;
  withdrawalName: string;
  sender?: string;
  equipmentSnapshot: any;
  senderFunctionalNumber: string;
  createdAt: string;
  updatedAt: string;
  equipment: Equipment;
  seiProcess: string;
  senderName: string;
  senderDocument: string;
  history: History;
  withdrawalDocument: string;
  technicianId: string;
  technicianName: string;
  status: string;
  unit: {
    name: string;
    localization: string;
  };
  brand: {
    name: string;
  };
  finishDate: string;
}

type FilterValues = {
  type?: ISelectOption;
  brand?: ISelectOption;
  createdAt?: string;
  updatedAt?: string;
  finishDate?: string;
  unit?: ISelectOption;
  status: ISelectOption;
  search: string;
  model?: ISelectOption;
  senderName?: ISelectOption;
  withdrawalName?: ISelectOption
  technicianName?: ISelectOption;
};

function OrderServiceTable() {
  const [orderServices, setOrderServices] = useState<OrderServiceData[]>([]);
  const [nextOrderServices, setNextOrderServices] = useState<
    OrderServiceData[]
  >([]);

  const [refreshRequest, setRefreshRequest] = useState<boolean>(false);
  const [workstations, setWorkstations] = useState<ISelectOption[]>();
  const [brands, setBrands] = useState<BrandData[]>([]);
  const[models, setModels] = useState<ISelectOption[]>();
  const[senderName, setSenderName] = useState<ISelectOption[]>();
  const[withdrawalName, setWithdrawalName] = useState<ISelectOption[]>();
  const[technicianName, setTechnicianName] = useState<ISelectOption[]>();
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [orderServicesToExport, setOrderServicesToExport] = useState<OrderServiceData[]>([]);

  const [selectedOrderServiceToEdit, setSelectedOrderServiceToEdit] =
    useState<OrderServiceData>();
  const [selectedOrderServiceToPrint, setSelectedOrderServiceToPrint] =
    useState<OrderServiceData>();

  const { isOpen, onClose, onOpen } = useDisclosure();
  const {
    isOpen: isOpenEditOrderService,
    onClose: onCloseEditOrderService,
    onOpen: onOpenEditOrderService,
  } = useDisclosure();
  const {
    isOpen: isOpenPrintOrderService,
    onClose: onClosePrintOrderService,
    onOpen: onOpenPrintOrderService,
  } = useDisclosure();

  const {
    control,
    watch,
    register,
    formState: { errors },
    reset,
  } = useForm<FilterValues>({ mode: 'onChange' });

  const watchFilter = watch();

  const handleEdit = (orderService: OrderServiceData) => {
    if (orderService) {
      setSelectedOrderServiceToEdit(orderService);
    }

    onOpenEditOrderService();
  };

  const handlePrint = (orderService: OrderServiceData) => {
    if (orderService) {
      setSelectedOrderServiceToPrint(orderService);
    }

    onOpenPrintOrderService();
  };

  const handleFilterChange = () => {
    const { type, createdAt, status, unit, brand, model, technicianName, senderName, withdrawalName,updatedAt, finishDate,} = watchFilter;

    let formattedfinishDate;
    if (finishDate !== null && finishDate !== '' && finishDate) {
      formattedfinishDate = new Date(finishDate).toLocaleDateString('en-us');
    }

    let formattedcreatedAt;
    if (createdAt !== null && createdAt !== '' && createdAt) {
      formattedcreatedAt = new Date(createdAt).toLocaleDateString('en-us');
    }

    let formattedupdatedAt;
    if (updatedAt !== null && updatedAt !== '' && updatedAt) {
      formattedupdatedAt = new Date(updatedAt).toLocaleDateString('en-us');
    }



    const dataFormatted = {
      type,
      createdAt: formattedcreatedAt,
      updatedAt: formattedupdatedAt,
      finishDate: formattedfinishDate,
      status,
      unit,
      search,
      brand,
      model,
      technicianName,
      senderName,
      withdrawalName,

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

  const formattedSenderName = (data: OrderServiceData[]): ISelectOption[] => {
    const uniqueSenderName = new Set<string>();
  
    data?.forEach(item => {
      uniqueSenderName.add(item.senderName);
    });
  
    const uniqueOptions: ISelectOption[] = Array.from(uniqueSenderName)
    .filter(senderName => !!senderName)
    .map(senderName => ({
      label: senderName,
      value: senderName
    }));
  
    return uniqueOptions;
  };

  const getSenderNames = async () => {
    try {
      const { data }: AxiosResponse<OrderServiceData[]> = await api.get(
        `equipment/listOrderService`
      );
      setSenderName(formattedSenderName(data));
    } catch (error) {
      setSenderName([]);
    }
  };

  const formattedWithdrawalName = (data: OrderServiceData[]): ISelectOption[] => {
    const uniqueWithdrawalName = new Set<string>();
  
    data?.forEach(item => {
      uniqueWithdrawalName.add(item.withdrawalName);
    });
  
    const uniqueOptions: ISelectOption[] = Array.from(uniqueWithdrawalName)
    .filter(withdrawalName => !!withdrawalName)
    .map(withdrawalName => ({
      label: withdrawalName,
      value: withdrawalName
    }));
  
    return uniqueOptions;
  };

  const getWithdrawalName = async () => {
    try {
      const { data }: AxiosResponse<OrderServiceData[]> = await api.get(
        `equipment/listOrderService`
      );
      setWithdrawalName(formattedWithdrawalName(data));
    } catch (error) {
      setWithdrawalName([]);
    }
  };

  const formattedTechnicianName = (data: OrderServiceData[]): ISelectOption[] => {
    const uniqueTechnicianName = new Set<string>();
  
    data?.forEach(item => {
      uniqueTechnicianName.add(item.technicianName);
    });
  
    const uniqueOptions: ISelectOption[] = Array.from(uniqueTechnicianName)
    .filter(technicianName => !!technicianName)
    .map(technicianName => ({
      label: technicianName,
      value: technicianName
    }));
  
    return uniqueOptions;
  };

  const getTechnicianName = async () => {
    try {
      const { data }: AxiosResponse<OrderServiceData[]> = await api.get(
        `equipment/listOrderService`
      );
      setTechnicianName(formattedTechnicianName(data));
    } catch (error) {
      setTechnicianName([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data }: AxiosResponse<BrandData[]> = await api.get(
        `equipment/brand`
      );
      setBrands(data);
    } catch (error) {
      setBrands([]);
      console.error('Nenhum Equipamento encontrado');
    }
  };

  const formattedModels = (data: OrderServiceData[]): ISelectOption[] => {
    const uniqueModels = new Set<string>();
  
    data?.forEach(item => {
      uniqueModels.add(item.equipment.model);
    });
  
    const uniqueOptions: ISelectOption[] = Array.from(uniqueModels)
    .filter(model => !!model) 
    .map(model => ({
      label: model,
      value: model
    }));
  
    return uniqueOptions;
  };

   const getModels = async () => {
    try {
      const { data }: AxiosResponse<OrderServiceData[]> = await api.get(
        `equipment/listOrderService`
      );
      setModels(formattedModels(data));
    } catch (error) {
      setModels([]);
    }
  };



  const formattedWorkstations = (data: Workstation[]): ISelectOption[] => {
    return data?.map((item) => {
      return { label: item.name, value: item.name };
    });
  };

  const getWorkstations = async () => {
    apiSchedula
      .get<Workstation[]>('workstations')
      .then((response) => {
        setWorkstations(formattedWorkstations(response.data));
      })
      .catch((error) => {});
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
      const { data }: AxiosResponse<OrderServiceData[]> = await api.get(
        `equipment/listOrderService?take=${limit}&skip=${offset}&${filter}`
      );
      setOrderServices(data);
    } catch (error) {
      setOrderServices([]);
      toast.error('Nenhuma Ordem de Serviço encontrada');
    }
  };

  const fetchNextItems = async () => {
    try {
      const { data }: AxiosResponse<OrderServiceData[]> = await api.get(
        `equipment/listOrderService?take=${limit}&skip=${
          offset + limit
        }&${filter}`
      );
      setNextOrderServices(data);
    } catch (error) {
      setNextOrderServices([]);
    }
  };

  const {
    isOpen: isReportOpen,
    onClose: onReportClose,
    onOpen: onReportOpen,
  } = useDisclosure();

  useEffect(() => {
    getTechnicianName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getWithdrawalName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getSenderNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getWorkstations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBrands();
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

  const handleReportExport = async (selectedType: string) => {
    setType(selectedType);
    setOrderServicesToExport(await getOrderServices(filter));
    onReportOpen();
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
                Ordem de Serviço
              </Text>
              <Button colorScheme={theme.colors.primary} onClick={onOpen}>
                Nova Ordem de Serviço
              </Button>
            </Flex>
            <Flex justifyContent="space-between" width="100%">
              <Text color="#00000" fontWeight="medium" fontSize="2xl">
                Últimas Ordens de Serviço
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
            <Divider borderColor="#00000" margin="15px 0 15px 0" />
            <Flex
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              width="100%"
            >
              <form id="orderService-filter" style={{ width: '100%' }}>
                <Flex gap="5px" alignItems="5px" mb="15px">
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
                        <AccordionPanel position="relative" zIndex="1">
                          <Grid
                            templateColumns="repeat(4, 1fr)"
                            gap="5px"
                          >
                            <NewControlledSelect
                              filterStyle
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
                            />
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="senderName"
                              id="senderName"
                              options={senderName}
                              placeholder="Remetente"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="withdrawalName"
                              id="withdrawalName"
                              options={withdrawalName}
                              placeholder="Destinatário"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="technicianName"
                              id="technicianName"
                              options={technicianName}
                              placeholder="Técnico"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />
                          </Grid>
                          <Grid
                            templateColumns="repeat(4, 1fr)"
                            gap="5px"
                          >
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="brand"
                              id="brand"
                              options={brands.map((brand) => ({
                                value: brand?.id ?? '',
                                label: brand?.name ?? '',
                              }))}
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
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="unit"
                              id="unit"
                              options={workstations}
                              placeholder="Local"
                              cursor="pointer"
                              variant="unstyled"
                              fontWeight="semibold"
                              size="sm"
                            />                    
                              <Datepicker
                                outsideModal
                                border={false}
                                placeholderText="Data de criação"
                                name="createdAt"
                                control={control}
                              />
                          </Grid>
                          <Grid
                            templateColumns="repeat(4, 1fr)"
                            gap="5px"
                          >
                              <Datepicker
                                outsideModal
                                border={false}
                                placeholderText="Data de conclusão"
                                name="finishDate"
                                control={control}
                              />
                              <Datepicker
                                outsideModal
                                border={false}
                                placeholderText="Última atualização"
                                name="updatedAt"
                                control={control}
                              />
                            <NewControlledSelect
                              filterStyle
                              control={control}
                              name="status"
                              id="status"
                              options={OSSTATUS}
                              placeholder="Status OS"
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
                </Flex>
              </form>
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
                  borderRadius="15px"
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
                        <Td>Status da OS</Td>
                        <Td>Data da OS</Td>
                        <Td />
                        <Td />
                      </Tr>
                    </Thead>
                    <Tbody fontWeight="semibold" maxHeight="200px">
                      {orderServices.map((orderService) => (
                        <Tr key={orderService.id}>
                          <Td fontWeight="medium">
                            Tombamento - {orderService.equipment.tippingNumber}
                            <Td p={0} fontWeight="semibold">
                              {orderService.equipment.type.name}{' '}
                              {orderService.equipment.brand.name}{' '}
                              {orderService.equipment.serialNumber}
                            </Td>
                          </Td>
                          <Td fontWeight="medium">
                            {orderService.equipment.unit.name} -{' '}
                            {orderService.equipment.unit.localization}
                            <Td
                              p={0}
                              fontWeight="semibold"
                              style={OSStatusStyleMap.get(orderService.status)}
                            >
                              {OSStatusMap.get(orderService.status)}
                            </Td>
                          </Td>

                          <Td>
                            {new Date(
                              orderService.createdAt
                            ).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </Td>
                          <Td>
                            <button onClick={onOpenEditOrderService}>
                              <IconButton
                                aria-label="Mudar status da ordem de serviço"
                                variant="ghost"
                                icon={<FaTools />}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEdit(orderService);
                                }}
                              />
                            </button>
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Gerar termo de ordem de serviço"
                              variant="ghost"
                              icon={<FaFileAlt />}
                              onClick={(event) => {
                                event.stopPropagation();
                                handlePrint(orderService);
                              }}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

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
                  {nextOrderServices.length > 0 && (
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
        </Flex>
        <OrderServiceEditModal
          onClose={onCloseEditOrderService}
          isOpen={isOpenEditOrderService}
          orderService={selectedOrderServiceToEdit}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
        />
        <OrderServiceRegisterModal
          onClose={onClose}
          isOpen={isOpen}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
          onOpenTerm={onOpenPrintOrderService}
        />
        <OrderServiceTermModal
          isOpen={isOpenPrintOrderService}
          onClose={onClosePrintOrderService}
          selectedOrderService={selectedOrderServiceToPrint as OrderServiceData}
          refreshRequest={refreshRequest}
          setRefreshRequest={setRefreshRequest}
        />
        <ReportModal
          isOpen={isReportOpen}
          onClose={onReportClose}
          type={type}
          orderServices={orderServicesToExport}
        />
      </GridItem>
    </Grid>
  );
}
export { OrderServiceTable };
