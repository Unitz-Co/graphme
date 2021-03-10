import GetAdvisorProfile from 'unitz-gql/advisor_profile/GetAdvisorProfile.gql';
import QueryAdvisorProfile from 'unitz-gql/advisor_profile/QueryAdvisorProfile.gql';
import InsertAdvisorProfile from 'unitz-gql/advisor_profile/InsertAdvisorProfile.gql';
import UpdateAdvisorProfile from 'unitz-gql/advisor_profile/UpdateAdvisorProfile.gql';

import GetAdvisor from 'unitz-gql/advisor/GetAdvisor.gql';
import QueryAdvisor from 'unitz-gql/advisor/QueryAdvisor.gql';
import InsertAdvisor from 'unitz-gql/advisor/InsertAdvisor.gql';
import DeleteAdvisor from 'unitz-gql/advisor/DeleteAdvisor.gql';

import GetTransaction from 'unitz-gql/transaction/GetTransaction.gql';
import GetTransactionAggregate from 'unitz-gql/transaction/GetTransactionAggregate.gql';

// import _ from 'lodash';

const { GqlBuilder } = require('@unitz/gqlbuilder');
require('dotenv').config();


if(!console.snapshot) {
  console.snapshot = (...args) => {
    console.log(...args);
    expect({ args }).toMatchSnapshot();
  }
} 
 

GqlBuilder.loadDocument({
  GetAdvisor,
  GetAdvisorProfile,
  GetAdvisorProfile,
  QueryAdvisorProfile,
  InsertAdvisorProfile,
  UpdateAdvisorProfile,

  GetAdvisor,
  QueryAdvisor,
  InsertAdvisor,
  DeleteAdvisor,

  GetTransaction,
  GetTransactionAggregate,
});

import AdvisorModel from '@uz/mod-models/AdvisorModel';
import UserModel from '@uz/mod-models/UserModel';
import TransactionModel from '@uz/mod-models/TransactionModel';
import TransactionAggregateModel from '@uz/mod-models/TransactionAggregateModel';

// change timeout 
jest.setTimeout(60 * 1000);