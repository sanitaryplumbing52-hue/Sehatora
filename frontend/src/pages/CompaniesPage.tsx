import { Building2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { CompanyFormModal } from "@/components/companies/CompanyFormModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useCompanies } from "@/hooks/useCompanies";

export function CompaniesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useCompanies({ page, search: search || undefined, page_size: 20 });

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Organizations you work with"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Company
          </Button>
        }
      />

      <div className="px-4 md:px-6 pb-10">
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border dark:border-border-dark">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search companies..."
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : !data?.results.length ? (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Add a company to start grouping contacts and deals."
              action={
                <Button onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> New Company
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted border-b border-border dark:border-border-dark">
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Industry</th>
                    <th className="px-5 py-3 hidden md:table-cell">Owner</th>
                    <th className="px-5 py-3">Contacts</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((company) => (
                    <tr
                      key={company.id}
                      onClick={() => navigate(`/companies/${company.id}`)}
                      className="border-b border-border dark:border-border-dark last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink dark:text-slate-100">{company.name}</p>
                        <p className="text-xs text-muted">{company.website || company.email || "—"}</p>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-muted">{company.industry || "—"}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted">{company.owner_name || "Unassigned"}</td>
                      <td className="px-5 py-3 text-muted">{company.contact_count ?? 0}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-muted">{company.deal_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} numPages={data.num_pages} count={data.count} onChange={setPage} />
            </div>
          )}
        </Card>
      </div>

      <CompanyFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
