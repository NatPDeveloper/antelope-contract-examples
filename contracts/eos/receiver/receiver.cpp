#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
#include <eosio/transaction.hpp>
#include <eosio/action.hpp>
#include <eosio/system.hpp>

using namespace eosio;

CONTRACT receiver : public eosio::contract {
  using contract::contract;
  public:

  [[eosio::action]] void testassert(std::string message) {
    check(message == "hello","not hello");
  }

  [[eosio::action]] void testprint(std::string message) {
    print(message);
  }

  [[eosio::action]] void testreceiver() {
    print("testreceiver");
    print("\n");
    print("get_first_receiver(): ");
    print(get_first_receiver());
    print("\n");
    print("get_code(): ");
    print(get_code());
    print("\n");
    print("current_receiver(): ");
    print(current_receiver());
    print("\n");
    print("publication_time(): ");
    print(publication_time().to_string());
    print("\n");
    print("get_sender(): ");
    print(get_sender());
    print("\n");
    print("current_block_number(): ");
    print(current_block_number());
    print("\n");
    print("current_block_time(): ");
    print(current_block_time().to_string());
    print("\n");
    print("tapos_block_num(): ");
    print(tapos_block_num());
    print("\n");
    print("tapos_block_prefix(): ");
    print(tapos_block_prefix());
    print("\n");
    print("expiration(): ");
    print(expiration());
    print("\n");
    print("transaction_size(): ");
    print(transaction_size());
    print("\n");
  }
};

extern "C" {
  void apply(uint64_t receiver, uint64_t code, uint64_t action) {
    print("receiver");
    print("\n");
    print("receiver: ");
    print(eosio::name(receiver));
    print("\n");
    print("code: ");
    print(eosio::name(code));
    print("\n");
    print("action: ");
    print(eosio::name(action));
    print("\n");
    switch (action) {
      EOSIO_DISPATCH_HELPER(receiver, (testassert)(testprint)(testreceiver))
    }
    eosio_exit(0);
  }
}