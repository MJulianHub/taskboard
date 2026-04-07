require "sidekiq/web"

Rails.application.routes.draw do
  authenticate :user do
    mount Sidekiq::Web => "/sidekiq"
  end

  namespace :api do
    devise_for :users, controllers: { sessions: "api/users/sessions", registrations: "api/users/registrations" }

    get "users/search", to: "api/users#search"

    resources :projects, only: [ :index, :show, :create ] do
      resources :tasks, only: [ :index, :create, :update ]
      member do
        post "add_member"
        delete "remove_member/:user_id", to: "projects#remove_member", as: :remove_member
      end
    end

    get "dashboard", to: "dashboard#index"
  end

  root "dashboard#index"
end
