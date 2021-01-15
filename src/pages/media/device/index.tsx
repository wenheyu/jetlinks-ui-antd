import {PageHeaderWrapper} from "@ant-design/pro-layout"
import {Badge, Card, Divider} from "antd";
import React, {Fragment, useEffect, useState} from "react";
import styles from '@/utils/table.less';
import SearchForm from "@/components/SearchForm";
import ProTable from "@/pages/system/permission/component/ProTable";
import {ColumnProps} from "antd/lib/table";
import Service from "./service";
import encodeQueryParam from "@/utils/encodeParam";
import {router} from "umi";
import DeviceUpdate from "./update/index";
import moment from "moment";

interface Props {

}

interface State {
  searchParam: any;
}

const initState: State = {
  searchParam: {pageSize: 10, terms: location?.query?.terms, sorts: {field: 'id', order: 'desc'}},
};
const MediaDevice: React.FC<Props> = () => {
  const service = new Service('media/device');
  const [loading, setLoading] = useState<boolean>(false);
  const [deviceUpdate, setDeviceUpdate] = useState<boolean>(false);
  const [deviceData, setDeviceData] = useState<any>({});
  const [result, setResult] = useState<any>({});

  const [productList, setProductList] = useState<any[]>([]);
  const [searchParam, setSearchParam] = useState(initState.searchParam);
  const statusMap = new Map();
  statusMap.set('online', 'success');
  statusMap.set('offline', 'error');
  statusMap.set('notActive', 'processing');

  const streamMode = new Map();
  streamMode.set('UDP', 'UDP');
  streamMode.set('TCP_ACTIVE', 'TCP主动');
  streamMode.set('TCP_PASSIVE', 'TCP被动');

  useEffect(() => {
    service.mediaGateway({}).subscribe((data) => {
      let productIdList: any[] = [];
      data.map((item: any) => {
        productIdList.push(item.productId)
      });
      setProductList(productIdList);
      searchParam.terms = {productId$IN: productIdList};
      handleSearch(encodeQueryParam(searchParam));
    })
  }, []);

  const handleSearch = (params?: any) => {
    setSearchParam(params);
    setLoading(true);
    service.query(encodeQueryParam(params)).subscribe(
      (data) => setResult(data),
      () => {
      },
      () => setLoading(false))
  };


  const columns: ColumnProps<any>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 200,
      ellipsis: true,
      fixed: 'left',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      render: (record: any) => record ? record : result.id,
      ellipsis: true
    },
    {
      title: '信令传输',
      dataIndex: 'transport',
      width: '90px',
    },
    {
      title: '流传输模式',
      dataIndex: 'streamMode',
      width: '110px',
      render: record => record ? streamMode.get(record) : '/',
    },
    {
      title: '通道数',
      dataIndex: 'channelNumber',
      width: '90px',
    },
    {
      title: '状态',
      dataIndex: 'state',
      width: '90px',
      render: record => record ? <Badge status={statusMap.get(record.value)} text={record.text}/> : '/',
      filters: [
        {
          text: '未启用',
          value: 'notActive',
        },
        {
          text: '离线',
          value: 'offline',
        },
        {
          text: '在线',
          value: 'online',
        },
      ],
      filterMultiple: false,
    },
    {
      title: '设备IP',
      dataIndex: 'host',
    },
    {
      title: '设备端口',
      dataIndex: 'port',
    },
    {
      title: '厂家',
      dataIndex: 'manufacturer',
      ellipsis: true
    },
    {
      title: '型号',
      dataIndex: 'model',
      ellipsis: true
    },
    {
      title: '固件版本',
      dataIndex: 'firmware',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      render: (text: any) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '/',
      sorter: true,
    },
    {
      title: '操作',
      key: 'center',
      fixed: 'right',
      width: 180,
      render: (record: any) => (
        <Fragment>
          <a
            onClick={() => {
              router.push(`/device/instance/save/${record.id}`);
            }}
          >
            查看
          </a>
          <Divider type="vertical"/>
          <a
            onClick={() => {
              setDeviceData(record);
              setDeviceUpdate(true);
            }}
          >
            编辑
          </a>
          <Divider type="vertical"/>
          <a
            onClick={() => {
              router.push(`/media/device/channel/${record.id}`);
            }}
          >
            查看通道
          </a>
          {/*<Divider type="vertical"/>
          <Popconfirm
            title="确认更新吗？"
            onConfirm={() => {

            }}>
            <a>更新通道</a>
          </Popconfirm>*/}
        </Fragment>
      )
    },
  ];
  return (
    <PageHeaderWrapper title="国标设备">
      <Card bordered={false} style={{marginBottom: 16}}>
        <div className={styles.tableList}>
          <div>
            <SearchForm
              search={(params: any) => {
                setSearchParam(params);
                params.productId$IN = productList;
                handleSearch({terms: {...params}, pageSize: 10, sorts: {field: 'id', order: 'desc'}});
              }}
              formItems={[
                {
                  label: '名称',
                  key: 'name$LIKE',
                  type: 'string',
                },
              ]}
            />
          </div>
        </div>
      </Card>
      <Card>
        <div className={styles.StandardTable}>
          <ProTable
            loading={loading}
            dataSource={result?.data}
            columns={columns}
            rowKey="id"
            scroll={{x: '150%'}}
            onSearch={(params: any) => {
              params.terms['productId$IN'] = productList;
              params.sorts = params.sorts.field ? params.sorts : {field: 'id', order: 'desc'};
              handleSearch(params);
            }}
            paginationConfig={result}
          />
        </div>
      </Card>
      {deviceUpdate && (
        <DeviceUpdate close={() => {
          setDeviceUpdate(false);
          searchParam.terms = {productId$IN: productList};
          handleSearch(encodeQueryParam(searchParam));
        }} data={deviceData}/>
      )}
    </PageHeaderWrapper>
  )
};
export default MediaDevice;